import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dailyjournal import conf

engine = sa.create_engine(conf.SQLALCHEMY_DATABASE_URI)
Base = declarative_base()
meta = Base.metadata
session = sessionmaker(bind=engine)()

from dailyjournal.models import *
