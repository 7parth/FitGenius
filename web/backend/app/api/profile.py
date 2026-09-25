from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.profile import UserProfile, AccessibilityProfile
from app.models.audit import AuditLog, AuditAction
from app.schemas.profile import (
    BasicProfileUpdate,
    FitnessProfileUpdate,
    AccessibilityProfileUpdate,
    OnboardingCompleteRequest,
    UserProfileResponse,
    AccessibilityProfileResponse,
)

router = APIRouter()


def _get_or_create_profile(user: User, db: Session) -> UserProfile:
    if not user.profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(user)
    return user.profile


def _get_or_create_accessibility(user: User, db: Session) -> AccessibilityProfile:
    if not user.accessibility_profile:
        ap = AccessibilityProfile(user_id=user.id)
        db.add(ap)
        db.commit()
        db.refresh(user)
    return user.accessibility_profile


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(current_user, db)
    return profile


@router.put("/basic", response_model=UserProfileResponse)
async def update_basic_profile(
    body: BasicProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(current_user, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.put("/fitness", response_model=UserProfileResponse)
async def update_fitness_profile(
    body: FitnessProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(current_user, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/accessibility", response_model=AccessibilityProfileResponse)
async def get_accessibility_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    ap = _get_or_create_accessibility(current_user, db)
    return ap


@router.put("/accessibility", response_model=AccessibilityProfileResponse)
async def update_accessibility_profile(
    body: AccessibilityProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    ap = _get_or_create_accessibility(current_user, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(ap, field, value)
    db.commit()
    db.refresh(ap)
    return ap


@router.post("/onboarding/complete", response_model=UserProfileResponse)
async def complete_onboarding(
    body: OnboardingCompleteRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(current_user, db)
    ap = _get_or_create_accessibility(current_user, db)

    for field, value in body.basic.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    for field, value in body.fitness.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    for field, value in body.accessibility.model_dump(exclude_none=True).items():
        setattr(ap, field, value)

    profile.onboarding_completed = True
    profile.onboarding_last_step = 5

    log = AuditLog(
        actor_id=current_user.id,
        target_id=current_user.id,
        action=AuditAction.onboarding_completed,
        resource_type="user",
    )
    db.add(log)
    db.commit()
    db.refresh(profile)
    return profile


@router.put("/onboarding/step", response_model=UserProfileResponse)
async def update_onboarding_step(
    step: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if step < 0 or step > 5:
        raise HTTPException(status_code=400, detail="Step must be 0–5")
    profile = _get_or_create_profile(current_user, db)
    profile.onboarding_last_step = step
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/export")
async def export_user_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Export all personal user data in accordance with GDPR privacy compliance."""
    from fastapi.responses import JSONResponse
    from app.models.workout import WorkoutSession
    from app.models.wearable import WearableData
    from app.models.gamification import UserAchievement
    from sqlalchemy import select

    profile = _get_or_create_profile(current_user, db)
    accessibility = _get_or_create_accessibility(current_user, db)

    # Gather workout history
    workout_sessions = db.scalars(
        select(WorkoutSession).where(WorkoutSession.user_id == current_user.id)
    ).all()

    # Wearable entries
    wearable_records = db.scalars(
        select(WearableData).where(WearableData.user_id == current_user.id)
    ).all()

    # Achievements
    user_achievements = db.scalars(
        select(UserAchievement).where(UserAchievement.user_id == current_user.id)
    ).all()

    data = {
        "export_metadata": {
            "app": "FitGenius",
            "exported_at": str(current_user.updated_at or current_user.created_at),
            "user_id": current_user.id,
        },
        "user_account": {
            "display_name": current_user.display_name,
            "email": current_user.email,
            "role": current_user.role,
            "is_active": current_user.is_active,
            "is_verified": current_user.is_verified,
            "created_at": str(current_user.created_at),
        },
        "profile": {
            "primary_goal": profile.primary_goal,
            "fitness_level": profile.fitness_level,
            "preferred_duration_minutes": profile.preferred_duration_minutes,
            "available_equipment": profile.available_equipment,
            "onboarding_completed": profile.onboarding_completed,
        },
        "accessibility_settings": {
            "high_contrast_mode": accessibility.high_contrast_mode,
            "font_size_preference": accessibility.font_size_preference,
            "reduced_motion": accessibility.reduced_motion,
            "captions_enabled": accessibility.captions_enabled,
            "simplified_ui": accessibility.simplified_ui,
            "has_visual_impairment": accessibility.has_visual_impairment,
            "has_hearing_impairment": accessibility.has_hearing_impairment,
            "has_mobility_limitation": accessibility.has_mobility_limitation,
        },
        "workout_history": [
            {
                "id": w.id,
                "status": w.status,
                "total_duration_seconds": w.total_duration_seconds,
                "calories_burned": w.calories_burned,
                "started_at": str(w.started_at) if w.started_at else None,
                "completed_at": str(w.completed_at) if w.completed_at else None,
            }
            for w in workout_sessions
        ],
        "wearable_records_count": len(wearable_records),
        "achievements_unlocked": len(user_achievements),
    }

    return JSONResponse(
        content=data,
        headers={"Content-Disposition": 'attachment; filename="fitgenius_user_data.json"'},
    )

