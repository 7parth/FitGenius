# Import all models so SQLAlchemy metadata is fully populated
# and Alembic can detect all tables on import.
from .base import Base, TimestampMixin, UUIDMixin  # noqa: F401
from .user import User, UserRole  # noqa: F401
from .profile import (  # noqa: F401
    UserProfile,
    AccessibilityProfile,
    FitnessLevel,
    FitnessGoal,
    TrainingLocation,
    InteractionMode,
    FontSizePreference,
)
from .exercise import Exercise, ExerciseCategory, DifficultyLevel, MuscleGroup  # noqa: F401
from .workout import (  # noqa: F401
    WorkoutTemplate,
    WorkoutTemplateExercise,
    WorkoutSession,
    WorkoutSessionExercise,
    ExercisePerformance,
    SessionStatus,
)
from .recommendation import Recommendation, RecommendationStage, FeedbackRating  # noqa: F401
from .gamification import (  # noqa: F401
    Achievement,
    UserAchievement,
    UserGamification,
    Challenge,
    ChallengeParticipant,
    BadgeTier,
    ChallengeType,
    ChallengeStatus,
)
from .wearable import WearableData, WearableSource, FatigueLevel  # noqa: F401
from .conversation import AIConversation  # noqa: F401
from .notification import Notification, NotificationType  # noqa: F401
from .audit import AuditLog, AuditAction  # noqa: F401
