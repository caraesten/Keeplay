import tornado.ioloop
import tornado.web
import tornado.auth
from tornado.options import define, options
import os,sys
import simplejson
import hashlib
import re
import logging
from pprint import pprint
sys.path = [os.getcwd()] + sys.path
from models import User
from couchdb import Server, ResourceNotFound
from collections import defaultdict
from datetime import datetime, timedelta

class SplashHandler(tornado.web.RequestHandler):
	@tornado.web.asynchronous
	def get(self):
		self.session.invalidate()
		self.render("templates/splash.html")

class GameHandler(tornado.web.RequestHandler):
        @tornado.web.asynchronous
        def get(self):
		# Check if user is either null or not a key
		if self.session.get('user'):
			user = self.session['user']
		else:
			self.redirect("/auth/facebook/")
			return
		melodies = user.getMelodies()
		self.render("templates/game.html",media_url=self.settings["media_url"])
		return			

class ScoreSaveHandler(tornado.web.RequestHandler):
        @tornado.web.asynchronous
        def get(self, score):  
                resp = {}
                self.write(resp)
                self.finish()
	# code for score save to DB for user here
	def post(self, score):
		response = {'status': 'failed'}
		try:
			user = self.session['user']
			scores = self.get_argument('scores')
			if not isinstance(scores, list):
				self.write(response)
				self.finish()
			for item in scores:
				if not item.isdigit():
					self.write(response)
					self.finish()
		except KeyError:
			self.write(response)
			self.finish()
		user.saveScore(score)	
		response['status'] = 'succeeded'
		self.write(response)
		self.finish()

class MelodySaveHandler(tornado.web.RequestHandler):
        @tornado.web.asynchronous
        def get(self, melody):  
                resp = {}
                self.write(resp)
                self.finish()
	# code for melody save to DB for user here
	def post(self):
		response = {'status': 'failed'}
		try: 
			user = self.session['user']
			melody = self.get_argument('melody')
			if not isinstance(melody, list):	
				self.write(response)
				self.finish()
			for item in melody:
				if not item['freq'].isdigit():
						self.write(response)
						self.finish()
				if not item['dur'].isdigit():
						self.write(response)
						self.finish()
		except KeyError:
				self.write(response)
				self.finish()
		user.saveMelody(melody)
		response['status'] = 'succeeded'
		self.write(response)
		self.finish()

# Facebook auth tends to be a huge pain. I copied this code from iFreeq; most of it should
# directly translate over.

class FacebookHandler(tornado.web.RequestHandler, tornado.auth.FacebookGraphMixin):
	@tornado.web.asynchronous
	def get(self):
		if self.get_argument("code", False):
			self.get_authenticated_user(
				redirect_uri = self.application.settings["base_url"] + 'auth/facebook/',
				client_id = self.settings["facebook_api_key"],
				client_secret = self.settings["facebook_secret"],
				code = self.get_argument("code"),
				callback = self.async_callback(self._on_login)
			)
			return 
		self.authorize_redirect(redirect_uri=(self.application.settings["base_url"] + 'auth/facebook/'),
										client_id=self.settings["facebook_api_key"],
										extra_params={"scope": "read_stream,publish_stream,offline_access"})

	def _on_login(self, user):
		active_user = User(user["id"])
		self.session["user"] = active_user
		self.redirect("/initgame")
		return	

class HighScoreLookup(tornado.web.RequestHandler):
        @tornado.web.asynchronous
        def get(self):
                resp = {}
                self.write(resp)
                self.finish()
	def post(self):
		# output user's top 10 high scores
		response = {'status': 'failed'}
		try:
			user = self.session['user']
			scores = self.get_argument('scores')
			if not isinstance(scores, list):
				self.write(response)
				self.finish()
			for item in scores:
				if not item.isdigit():
					self.write(response)
					self.finish()
			highscores = scores.sort()
			render('highscores.html')
			return highscores[:9:]
		except KeyError:
			self.write(response)
			self.finish()
