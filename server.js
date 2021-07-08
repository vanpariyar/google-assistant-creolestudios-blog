const express = require('express');
const bodyParser = require('body-parser');
const {
  conversation,
  Simple,
  Card,
  Image,
  Link,
  OpenURL
} = require('@assistant/conversation');

// const { conversation } = require('actions-on-google');


const fetch  = require('node-fetch');
const Entities = require('html-entities').XmlEntities;

const server = express();
const entities = new Entities();
const assistant = conversation({debug: true});

server.set('port', process.env.PORT || 5000);
server.use(bodyParser.json({type: 'application/json'}));

server.use(express.json());

assistant.handle('Get_New_Blogs', async conv => {
  const data = await getBlogs();
  conv.add(new Simple({
      speech: `New Blog title is ${ entities.decode(data.title) } beautifully written by ${ entities.decode(data.user.name) } who is ${ entities.decode(data.user.description) }`,
      text: `New Blog title is ${ entities.decode(data.title) } beautifully written by ${ entities.decode(data.user.name) } who is ${ entities.decode(data.user.description) } ` ,
  }));
  conv.add(new Card({
    text: `New Blog title is ${ entities.decode(data.title) } beautifully written by **${ entities.decode(data.user.name) }** who is *${ entities.decode(data.user.description) }* `, // Note the two spaces before '\n' required for
    subtitle: `${ entities.decode(data.user.name) }`,
    title: `Title: ${ entities.decode(data.title) }`,
    button: new Link({
      name: 'Learn More',
      open: {
        hint: "LINK_UNSPECIFIED",
        "url": data.link,
      },
    }),
    image: new Image({
      url: data.image.url,
      alt: data.image.alt,
    }),
    imageFill: 'CROPPED',
  }));
  
  conv.scene.next.name = 'actions.page.END_CONVERSATION';
  
});

/* Getting blog Data */
async function getAuthor(url){
  try{
    let user = await fetch( 'https://www.creolestudios.com/wp-json/wp/v2/users/' + url , {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(res => res.json());  

    return {
      "name": user.name,
      "description": user.description.replace(/(<([^>]+)>)/gi, ""),
    }
  } catch(err) {
     return {
      "name": err,
      "description": err,
    }   
  }
  
}
async function getFeaturedImage(mediaId){
    let media = await fetch( mediaId , {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(res => res.json());  

    return {
      "url": media[0].link,
      "alt": media[0].title.rendered,
    }
}
async function getBlogs() {
    let page = await fetch('https://creolestudios.com/wp-json/wp/v2/posts?per_page=1&_embed' , {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(res => res.json());
    const author = await getAuthor(page[0].author);
    const image = await getFeaturedImage(page[0]._links['wp:attachment'][0].href);
    return {
      'title': page[0].title.rendered,
      'user': author,
      'link': page[0].link,
      'image': image, 
    }
   
}

server.post('/creole', assistant);

server.get('/')

server.listen(server.get('port'), function () {
	console.log('Express server started on port', server.get('port'));
});