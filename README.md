# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_


## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

* [Python](https://www.python.org/)
* [Node.js](https://nodejs.org/)
* [udacity/mws-restaurant-stage-2](https://github.com/udacity/mws-restaurant-stage-2)

### Installing

1. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. 

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`.

2. With your server running, visit the site: `http://localhost:8000`.

3. It might be better to run a custom http server that supports content-types otherwise the service worker might not be registered when served with "text/plain" content-type:
[HaiyangXu/Server.py](https://gist.github.com/HaiyangXu/ec88cbdce3cdbac7b8d5)

## Built With

* [Node.js](https://nodejs.org/)

## Contributing

## Versioning

## Authors

* **David Harris** - [@forbiddenvoid](https://github.com/forbiddenvoid)
* **Andrew W.** - [@hbkwong](https://github.com/hbkwong)
* **Jesse Meijer** - *Edited* - [@jmmeijer](https://github.com/jmmeijer)

## License

## Acknowledgments

* Forked from [udacity/mws-restaurant-stage-1](https://github.com/udacity/mws-restaurant-stage-1)