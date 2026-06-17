from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Integer,
    Date,
    TIMESTAMP
)

from sqlalchemy.sql import func

from database import Base


class Trip(Base):

    __tablename__ = "trip"

    id = Column(
        BigInteger,
        primary_key=True
    )

    title = Column(String)

    country = Column(String)

    city = Column(String)

    start_date = Column(Date)

    end_date = Column(Date)

    people = Column(Integer)

    user_id = Column(
        BigInteger,
        nullable=True
    )

    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )