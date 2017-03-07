const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');
const {BlogPosts} = require('../models.js');

// this lets us use *should* style syntax in our tests
// so we can do things like `(1 + 1).should.equal(2);`
// http://chaijs.com/api/bdd/
const should = chai.should();

// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);

describe('Blog Post', function () {
	// Before our tests run, we activate the server. Our `runServer`
  // function returns a promise, and we return the that promise by
  // doing `return runServer`. If we didn't return a promise here,
  // there's a possibility of a race condition where our tests start
  // running before our server has started.
  before(function() {
    return runServer();
  });

  // although we only have one test module at the moment, we'll
  // close our server at the end of these tests. Otherwise,
  // if we add another test module that also has a `before` block
  // that starts our server, it will cause an error because the
  // server would still be running from the previous tests.
  after(function() {
    return closeServer();
  });

  it('should get all blog posts on GET', function () {
  	return chai.request(app)
	  	.get('/blog-posts')
	  	.then(function(res) {
	  		res.should.have.status(200);
	  		res.should.be.json;
	  		res.body.should.be.a('array');
	  		res.body.length.should.be.at.least(1);
	  		const expectedKeys = ['id', 'title', 'content', 'author', 'publishDate'];
	  		res.body.forEach(function(item) {
	  			item.should.be.a('object');
	  			item.should.include.keys(expectedKeys);
  			});
  		});
  });

  it('should add blog post on POST', function() {
   const newPost = {title: 'Testing', content: 'testing', author: 'Tester McTesterson'};
   return chai.request(app)
    .post('/blog-posts')
    .send(newPost)
    .then(function(res) {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.include.keys('id', 'title', 'content', 'author', 'publishDate');
      res.body.id.should.not.be.null;
        // response should be deep equal to `newItem` from above if we assign
        // `id` to it from `res.body.id`
      res.body.title.should.equal(newPost.title);
      res.body.content.should.equal(newPost.content);
      res.body.author.should.equal(newPost.author);
  		});
		});

		it('should update items on PUT', function() {
    // we initialize our updateData here and then after the initial
    // request to the app, we update it with an `id` property so
    // we can make a second, PUT call to the app.
    const updateData = {
      title: 'edited',
      content: 'edited content',
      author: 'New Author'
    };

    return chai.request(app)
      // first have to get so we have an idea of object to update
      .get('/blog-posts')
      .then(function(res) {
        updateData.id = res.body[0].id;
        // this will return a promise whose value will be the response
        // object, which we can inspect in the next `then` back. Note
        // that we could have used a nested callback here instead of
        // returning a promise and chaining with `then`, but we find
        // this approach cleaner and easier to read and reason about.
        return chai.request(app)
          .put(`/blog-posts/${updateData.id}`)
          .send(updateData);
      })
      // prove that the PUT request has right status code
      // and returns updated item
      .then(function(res) {
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.title.should.equal(updateData.title);
        res.body.content.should.equal(updateData.content);
        res.body.author.should.equal(updateData.author);
      });
  });

  it('should delete selected blog post', function() {
  	let post;

  	return chai.request(app)
  		.get('/blog-posts')
  		.then(function(res) {
  			post = res.body[0];
  			return chai.request(app)
  				.delete(`/blog-posts/${post.id}`);
  		})
  		.then(function(res) {
  			res.should.have.status(204);
  		})
  });
});