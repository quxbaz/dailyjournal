from uuid import uuid4
from sqlalchemy import Column, Integer, String
from dailyjournal.db import Base

def uniq_id():
  return str(uuid4())

class Entry(Base):
  __tablename__ = 'entry'
  id = Column(String, primary_key=True)
  date = Column(String(10))
  text = Column(String(2000))
  def __init__(self, date='', text=''):
    self.id = uniq_id()
    self.date = date
    self.text = text
  @property
  def serialized(self):
    return {
      'id'   : self.id,
      'date' : self.date,
      'text' : self.text
    }
  @property
  def year(self):
    return self.date[:4]
  @property
  def month(self):
    return self.date[5:7]
  @property
  def day(self):
    return self.date[8:10]
  def __repr__(self):
    return '<Entry id="{0}" date="{1}" text="{2}">'.format(self.id, self.date, self.text[:40])
