import tornado.ioloop
import tornado.web
import tornado.auth
from tornado.options import define, options
import os,sys
import logging
import simplejson
import hashlib
import re
import logging
import urllib2
import json
from pprint import pprint
sys.path = [os.getcwd()] + sys.path
from models import User
from couchdb import Server, ResourceNotFound
from collections import defaultdict
from datetime import datetime, timedelta
from pprint import pprint

class SplashHandler(tornado.web.RequestHandler):
	@tornado.web.asynchronous
	def get(self):
		self.session.invalidate()
		self.render("templates/splash.html", media_url=self.settings["media_url"])

class InstructionsHandler(tornado.web.RequestHandler):
	@tornado.web.asynchronous
	def get(self):
		self.render("templates/instructions.html", media_url=self.settings["media_url"])


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
			melodies_json = []
			if melodies:
				melodies.reverse()
				melodies = melodies[:4]
				for melody in melodies:
					mel_string = json.dumps(melody)
					melodies_json.append(mel_string)
			self.render("templates/game.html",media_url=self.settings["media_url"], melodies=melodies_json)
			return			

class ScoreSaveHandler(tornado.web.RequestHandler):
	@tornado.web.asynchronous
	def get(self, score):  
			resp = {}
			self.write(resp)
			self.finish()
	# code for score save to DB for user here
	def post(self):
		response = {'status': 'failed'}
		try:
			user = self.session['user']
		except KeyError:
			response['status'] = 'login'
			self.session.invalidate()
			self.write(response)
			self.finish()
			return
		score = int(self.get_argument('score'))
		response = {'status': 'failed'}
		try:
			user.saveScore(score)
		except:
			self.write(response)
			self.finish()
		response['status'] = 'succeeded'
		self.write(response)
		self.finish()

class MelodySaveHandler(tornado.web.RequestHandler):
	@tornado.web.asynchronous
	# code for melody save to DB for user here
	def post(self):
		response = {'status': 'failed'}
		try:
			user = self.session['user']
		except KeyError:
			response['status'] = 'login'
			self.session.invalidate()
			self.write(response)
			self.finish()
			return
		try: 
			body = self.request.body
			body_decoded = urllib2.unquote(body)
			logging.debug("Body:" + body_decoded)
			param_list = body_decoded.split('&')
			melody = []
			cur_freq = None
			cur_dur = None
			freq_lock = False
			dur_lock = False
			
			# Sometimes, AJAX sucks and you have to write JSON parsers
			# manually. I suppose I could use XML here, but, for
			# consistency, I decided not to
			
			for param in param_list:
				# Get the key / value pairs
				key_str = param.partition('=')[0]
				val = param.partition('=')[2]
				if key_str.find('[freq]') != -1 and freq_lock == False:
					key = "freq"
					freq_lock = True
					cur_freq = val
				elif key_str.find('[dur]') != -1 and dur_lock == False:
					key = "dur"
					dur_lock = True
					cur_dur = val
				elif freq_lock and dur_lock:
					melody.append({'freq': str(cur_freq), 'dur':str(cur_dur)})
					cur_freq = None
					cur_dur = None
					freq_lock = False
					dur_lock = False
				else:
					response['status'] = "failed: Frequency or duration missing from query string or out of order"
					self.write(response)
					self.finish()
					return

			pprint(melody)				
			if not isinstance(melody, list):	
				response['status'] = "failed: Not a list. Recieved: " + melody
				self.write(response)
				self.finish()
				return
			for item in melody:
				try:
					float(item['freq'])
				except ValueError:
					response['status'] = "failed: Frequency not a number"
					self.write(response)
					self.finish()
					return
				try:
					float(item['dur'])
				except ValueError:
					response['status'] = "failed: Duration not a number"
					self.write(response)
					self.finish()
					return
		except KeyError:
			self.write(response)
			self.finish()
			return
		if not user.getUserID():
			response['status'] = 'login'
			self.session.invalidate()
			self.write(response)
			self.finish()
			return
		user.saveMelody(melody)
		response['status'] = 'succeeded'
		self.write(response)
		self.finish()

# Facebook auth tends to be a huge pain. I copied this code from iFreeq; most of it should
# directly translate over.

class FacebookHandler(tornado.web.RequestHandler, tornado.auth.FacebookGraphMixin):
	@tornado.web.asynchronous
	def get(self):
		ex_qstring = ""
		if self.get_argument('fbwindow', False):
			self.session['fb_window'] = True
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
										extra_params={})

	def _on_login(self, user):
		if user["id"]:
			active_user = User(user["id"])
			self.session["user"] = active_user
			if not self.session.get('fb_window', False):
				self.redirect("/initgame")
			else:
				self.session['fb_window'] = False
				self.render("templates/close.html",media_url=self.settings["media_url"], error=False)
		else:
			if not self.session.get('fb_window', False):
				self.redirect('/')
			else:
				self.render("templates/close.html",media_url=self.settings["media_url"], error=True)
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
		except KeyError:
			response['status'] = 'login'
			self.session.invalidate()
			self.write(response)
			self.finish()
			return
		try:
			self.write({'status': 'succeeded', 'data':user.getHighScores()})
			self.finish()
		except KeyError:
			self.write(response)
			self.finish()
