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
from models import User, Melody
from couchdb import Server, ResourceNotFound
from collections import defaultdict
from datetime import datetime, timedelta

class SplashHandler(tornado.web.RequestHandler):
	@tornado.web.asynchronous
	def get(self):	
		self.render("templates/splash.html")

class GameHandler(tornado.web.RequestHandler):
        @tornado.web.asynchronous
        def get(self):  
		resp = {}
                self.write(resp)
		self.finish()

class ScoreSaveHandler(tornado.web.RequestHandler):
        @tornado.web.asynchronous
        def get(self):  
                resp = {}
                self.write(resp)
                self.finish()

class MelodySaveHandler(tornado.web.RequestHandler):
        @tornado.web.asynchronous
        def get(self):  
                resp = {}
                self.write(resp)
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
		active_user = User(id=user["id"],name=user["name"],access_token=user["access_token"])
		self.session["persistent"]["user"] = active_user
		if self.session["gamedata"]["scoresave"]:
			scoresave = True
			self.session["gamedata"]["scoresave"] = False
		else:
			scoresave = False
			self.session["gamedata"]["scoresave"] = False
		self.render("templates/auth_close.html")

class HighScoreLookup(tornado.web.RequestHandler):
        @tornado.web.asynchronous
        def get(self):
                resp = {}
                self.write(resp)
                self.finish()
