from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.gamification import UserGamification
from app.models.profile import UserProfile
from app.models.revoked_token import RevokedRefreshToken
from app.models.user import User, UserRole
from app.schemas.auth import (
    LoginRequest,
    MeResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_REGISTER)
async def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        display_name=body.display_name.strip(),
        role=UserRole.user,
    )
    db.add(user)
    db.flush()  # get user.id

    # Create default profile and gamification rows
    profile = UserProfile(user_id=user.id)
    gamification = UserGamification(user_id=user.id)
    db.add(profile)
    db.add(gamification)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.id})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.RATE_LIMIT_LOGIN)
async def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token = create_access_token({"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.id})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(body: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(body.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from None
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    # Refresh-token revocation is persisted in Supabase; only a digest is stored.
    if db.query(RevokedRefreshToken).filter(
        RevokedRefreshToken.token_hash == hash_token(body.refresh_token),
        RevokedRefreshToken.expires_at > datetime.now(UTC),
    ).first():
        raise HTTPException(status_code=401, detail="Token has been revoked")

    access_token = create_access_token({"sub": user.id, "role": user.role})
    new_refresh = create_refresh_token({"sub": user.id})
    return TokenResponse(access_token=access_token, refresh_token=new_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    body: RefreshRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        payload = decode_token(body.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from None

    if payload.get("type") != "refresh" or payload.get("sub") != current_user.id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    expires_at = datetime.fromtimestamp(payload["exp"], UTC)
    token_hash = hash_token(body.refresh_token)
    revoked = db.get(RevokedRefreshToken, token_hash)
    if not revoked:
        db.add(RevokedRefreshToken(
            token_hash=token_hash,
            user_id=current_user.id,
            expires_at=expires_at,
        ))
    # Opportunistically prune expired records so the table remains bounded.
    db.query(RevokedRefreshToken).filter(
        RevokedRefreshToken.expires_at <= datetime.now(UTC)
    ).delete(synchronize_session=False)
    db.commit()


@router.get("/me", response_model=MeResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    onboarding_completed = (
        current_user.profile.onboarding_completed if current_user.profile else False
    )
    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        onboarding_completed=onboarding_completed,
    )
