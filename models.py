from couchdb import Server, ResourceNotFound
from uuid import uuid4
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
			initials = user['initials']
			scores = user['scores']
			melodies = user['melodies']
		except ResourceNotFound:
			initials = ""
			scores = []
			melodies = []
			userdb[userid] = {'_id':userid, 'initials': initials, 'scores': scores, 'melodies': melodies}
		
	def saveScore(self, score):
		userdb = server[self.dbname]
		scores.append(score)
		userdb[self.userid]['scores'] = scores	

	def setInitials(self, itls):
                userdb = server[self.dbname]
		initials = itls
		userdb[self.userid]['initials'] = initials

	def saveMelody(self, melody):
                userdb = server[self.dbname]
		m = melody
		self.melodies.append(m)
		userdb[self.userid]['melodies']	

	def getUserID(self):
		return self.userid

	def getMelodies(self):
                userdb = server[self.dbname]
		user = userdb[self.userid]
		return user.get('melodies')
	
	def getInitials(self):
		return self.initials

	def getScores():
                userdb = server[self.dbname]
		return userdb[self.userid]['scores']	
