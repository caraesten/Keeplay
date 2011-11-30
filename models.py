from couchdb import Server, ResourceNotFound
from uuid import uuid4
from pprint import pprint
from datetime import datetime
import simplejson

server = Server()

class User:
	userid = None
	initials = None
	scores = None 
	melodies=None
	dbname = 'kp_users'

	def __init__(self, userid):
		# cause crash if there's a database KeyError. Expected behavior.
		userdb = server[self.dbname]
			
		try:
			user = userdb[userid]
			self.initials = user['initials']
			self.scores = user['scores']
			self.melodies = user['melodies']
			self.userid = userid
		except ResourceNotFound:
			self.initials = ""
			self.scores = []
			self.melodies = []
			self.userid = userid
			userdb[userid] = {'initials': self.initials, 'scores': self.scores, 'melodies': self.melodies}
			
		
	def saveScore(self, score):
		userdb = server[self.dbname]
		user = userdb[self.userid]
		if self.scores:
			self.scores.append({'score':score, 'time':datetime.now().strftime('%m/%d/%y')})
		else:
			self.scores = [{'score':score, 'time':datetime.now().strftime('%m/%d/%y')}]
		
		user['scores'] = self.scores
		userdb.save(user)

	def setInitials(self, itls):
		userdb = server[self.dbname]
		initials = itls
		userdb[self.userid]['initials'] = initials

	def saveMelody(self, melody):
		userdb = server[self.dbname]
		m = melody
		user = userdb[self.userid]
		if self.melodies:
			self.melodies.append(m)
		else:
			self.melodies = [m]
		user['melodies'] = self.melodies
		userdb.save(user)

	def getUserID(self):
		return self.userid

	def getMelodies(self):
		userdb = server[self.dbname]
		user = userdb[self.userid]
		return user.get('melodies')
	
	def getInitials(self):
		return self.initials

	def getScores(self):
		userdb = server[self.dbname]
		return userdb[self.userid]['scores']	

	def getHighScores(self):
		hs = sorted(self.scores, reverse=True)
		return hs[:3]
