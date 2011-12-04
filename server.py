from tornado.options import define, options
import tornado.web
import os, sys
sys.path = [os.getcwd()] + sys.path
from game_server import SplashHandler,InstructionsHandler,GameHandler,ScoreSaveHandler,MelodySaveHandler, FacebookHandler, HighScoreLookup
from passwords import passwords

settings = {
	"cookie_secret": passwords['cookie_secret'],
	# "session_storage": "mongodb://localhost:27017/sessions",
	#"session_storage": "memcached",
	# NOTE: This is not in the Tornado base distribution. Part of a fork.
	"session_storage": "redis://localhost:6379/1",
	"facebook_api_key": "144016919031374",
	"facebook_secret": passwords['facebook_secret'],
	"login_url": "/auth/facebook/",
	"base_url": "http://keeplay.estenh.com/",
	"media_url": "http://keeplay.estenh.com/static/"
}

application = tornado.web.Application([
		(r"/",SplashHandler),
		(r"/instructions", InstructionsHandler),
		(r"/initgame", GameHandler),
		(r"/savescore",ScoreSaveHandler),
		(r"/savemelody/", MelodySaveHandler),
		(r"/auth/facebook/", FacebookHandler),
		(r"/data/scorelookup/",HighScoreLookup)
], **settings)

def main_app():
	define("port", default=8991, help="Port to listen")
	tornado.options.parse_command_line()
	application.listen(int(options.port))
	tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
	main_app()

