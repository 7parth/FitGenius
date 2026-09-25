from .auth import (  # noqa: F401
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    AccessTokenResponse,
    MeResponse,
)
from .profile import (  # noqa: F401
    BasicProfileUpdate,
    FitnessProfileUpdate,
    AccessibilityProfileUpdate,
    OnboardingCompleteRequest,
    UserProfileResponse,
    AccessibilityProfileResponse,
)
from .exercise import (  # noqa: F401
    ExerciseCreate,
    ExerciseUpdate,
    ExerciseResponse,
    ExerciseListResponse,
)
from .workout import (  # noqa: F401
    StartSessionRequest,
    LogSetRequest,
    SwapExerciseRequest,
    WorkoutSessionResponse,
    WorkoutSessionSummary,
    WorkoutHistoryResponse,
    WorkoutTemplateResponse,
)
from .recommendation import (  # noqa: F401
    GenerateRecommendationRequest,
    RecommendationFeedbackRequest,
    RecommendationResponse,
    RecommendationHistoryResponse,
)
from .gamification import (  # noqa: F401
    GamificationSummaryResponse,
    LeaderboardResponse,
    ChallengeResponse,
    ChallengeProgressResponse,
    JoinChallengeRequest,
    UpdateChallengeProgressRequest,
    AchievementResponse,
    UserAchievementResponse,
)
from .progress import (  # noqa: F401
    ProgressSummaryResponse,
    ProgressHistoryResponse,
    ExerciseProgressResponse,
    PersonalRecord,
    ActivityCalendarResponse,
)
from .coach import (  # noqa: F401
    SendMessageRequest,
    SendMessageResponse,
    ConversationSummary,
    ConversationDetailResponse,
)
from .wearable import (  # noqa: F401
    WearableDataCreate,
    WearableDataResponse,
    FatigueResponse,
)
from .admin import (  # noqa: F401
    AdminUserListResponse,
    AdminUserUpdate,
    AdminStatsResponse,
    ChallengeCreate,
)
