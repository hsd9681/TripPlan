from sqlalchemy import (
    Column,
    BigInteger,
    String,
    TIMESTAMP
)

from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)
    email = Column(String)
    password = Column(String)
    nickname = Column(String)
    provider = Column(String, default="local")
    created_at = Column(TIMESTAMP, server_default=func.now())