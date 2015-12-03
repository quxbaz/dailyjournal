from flask import Blueprint, request, render_template
from flask.ext.restful import Api, Resource
from dailyjournal import models
from dailyjournal import db

blueprint = Blueprint(__name__, __name__)
rest = Api(blueprint)

@blueprint.route('/')
def app():
  return render_template('home.html')

class Year(Resource):
  def get(self):
    year = request.args.get('year')
    entries = db.session.query(models.Entry).all()
    return [entry.serialized for entry in entries if entry.year == year]

class Entry(Resource):
  def get(self):
    date = request.args.get('date')
    query = db.session.query(models.Entry).filter(models.Entry.date == date)
    if query.count() == 1:
      return query.one().serialized
    else:
      return {}
  def post(self):
    content = request.get_json()
    date = content.get('date')
    query = db.session.query(models.Entry).filter(models.Entry.date == date)
    if (query.count() > 0):
      return {}
    entry = models.Entry(date=content.get('date'), text=content.get('text'))
    try:
      db.session.add(entry)
      db.session.commit()
    except:
      db.session.rollback()
    return entry.serialized
  def put(self, id):
    content = request.get_json()
    date = content.get('date')
    query = db.session.query(models.Entry).filter(models.Entry.date == date)
    if query.count() == 1:
      entry = query.one()
      entry.text = content.get('text')
      db.session.commit()
      # db.session.rollback()
      return entry.serialized
    else:
      return {}

rest.add_resource(Year, '/year')
rest.add_resource(Entry, '/entry', '/entry/<id>')
