const { AdamantApi } = require('adamant-api')

const api = new AdamantApi({
  nodes: [
    'https://bid.adamant.im',
    'http://localhost:36666',
    'https://endless.adamant.im',
    'https://clown.adamant.im',
    'https://unusual.adamant.im',
    'https://debate.adamant.im',
    'http://23.226.231.225:36666',
    'http://78.47.205.206:36666',
    'https://lake.adamant.im',
    'https://sunshine.adamant.im'
  ]
})

api.sendMessage(
  'fence theme twist media soul month cement sorry vanish shield crunch utility',
  'U922832474468487910',
  JSON.stringify({ token: 1, action: 'remove', provider: 'fcm', amount: '0.01' }),
  3,
).then((e) => console.log('sent',e )).catch(err => console.log(err));

