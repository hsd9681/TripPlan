from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    Text,
    Double,
    TIMESTAMP
)

from sqlalchemy.sql import func

from database import Base


class Schedule(Base):

    __tablename__ = "schedule"

    id = Column(
        BigInteger,
        primary_key=True
    )

    trip_id = Column(
        BigInteger
    )

    day_number = Column(
        Integer
    )

    order_no = Column(
        Integer
    )

    place_id = Column(
        String
    )

    name = Column(
        String
    )

    category = Column(
        String
    )

    photo = Column(
        Text
    )

    rating = Column(
        Double
    )

    address = Column(
        Text
    )

    duration = Column(
        Integer
    )

    lat = Column(
        Double
    )

    lng = Column(
        Double
    )

    memo = Column(
        Text
    )

    cost = Column(
        Integer,
        default=0,
        nullable=True
    )

    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )