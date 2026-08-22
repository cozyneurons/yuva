# Import all models here so Alembic's autogenerate sees them
from app.db.base import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.employee import Employee  # noqa: F401
from app.models.attendance import Attendance  # noqa: F401
from app.models.leave import Leave  # noqa: F401
from app.models.notification import Notification  # noqa: F401
