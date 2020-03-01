const express = require('express');
const bodyParser = require('body-parser');
const {dialogflow, SimpleResponse, JsonObject, BasicCard, Button, Image} = require('actions-on-google');
const fetch  = require('node-fetch');
const Entities = require('html-entities').XmlEntities;
 

const server = express();
const entities = new Entities();
const assistant = dialogflow();

		
server.set('port', process.env.PORT || 5000);
server.use(bodyParser.json({type: 'application/json'}));

assistant.intent('Get New Blogs', async conv => {
  const data = await getBlogs();
  conv.close(new SimpleResponse({
      speech: `New Blog title is ${ entities.decode(data.title) } buatifully written by ${ entities.decode(data.user.name) } who is ${ entities.decode(data.user.description) }`,
      text: `New Blog title is ${ entities.decode(data.title) } buatifully written by ${ entities.decode(data.user.name) } who is ${ entities.decode(data.user.description) } ` ,
  }));
  conv.close(new BasicCard({
    text: `New Blog title is ${ entities.decode(data.title) } buatifully written by **${ entities.decode(data.user.name) }** who is *${ entities.decode(data.user.description) }* `, // Note the two spaces before '\n' required for
    subtitle: `${ entities.decode(data.user.name) }`,
    title: `Title: ${ entities.decode(data.title) }`,
    buttons: new Button({
      title: 'Learn More',
      url: data.link,
    }),
    image: new Image({
      url: 'https://www.creolestudios.com/wp-content/uploads/2019/11/Creole-Defualt.png',
      alt: 'Creole Studios',
    }),
    display: 'CROPPED',
  }));
  
  
});

/* Getting blog Data */
async function getAuthor(url){
    let user = await fetch( 'https://www.creolestudios.com/wp-json/wp/v2/users/' + url , {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(res => res.json());  

    return {
      "name": user.name,
      "description": user.description,
    }
}
async function getBlogs() {
    let page = await fetch('http://creolestudios.com/wp-json/wp/v2/posts?per_page=1' , {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(res => res.json());
    const author = await getAuthor(page[0].author)
    return {
      'title': page[0].title.rendered,
      'user': author,
      'link': page[0].link,
    }
   
}

server.post('/creole', assistant);

server.listen(server.get('port'), function () {
	console.log('Express server started on port', server.get('port'));
});