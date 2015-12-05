from flask import Blueprint, request, render_template, jsonify
from flask.ext.restful import Api, Resource
from dailyjournal import models
from dailyjournal import db

blueprint = Blueprint(__name__, __name__)
rest = Api(blueprint)

@blueprint.route('/')
def app():
  entries = [entry.serialized for entry in db.session.query(models.Entry).all()]
  return render_template('home.html', entries=entries)

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
    entry = db.session.query(models.Entry).get(id)
    entry.text = request.get_json().get('text')
    db.session.commit()
    return entry.serialized
  def delete(self, id):
    query = db.session.query(models.Entry).get(id) # Add error checking here.
    db.session.delete(query)
    return '', 204

rest.add_resource(Year, '/year')
rest.add_resource(Entry, '/entry', '/entry/<id>')
