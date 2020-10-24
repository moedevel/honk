const fs = require('fs');
const axios = require('axios');
var archiver = require('archiver');
const readline = require('readline');
var rimraf = require('rimraf');
var ms = require('ms');
require('dotenv').config();
const {
    google
} = require('googleapis');
const async = require("async");
const Discord = require("discord.js");
var xpath = require('xpath'),
    dom = require('xmldom').DOMParser
require('events').EventEmitter.prototype._maxListeners = 1000;
var bot = new Discord.Client();
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';
const download_nhentai = (url, image_path) =>
    axios({
        url,
        responseType: 'stream',
        headers: {
            'Referer': 'https://nhentai.net'
        }
    }).then(
        response =>
        new Promise((resolve, reject) => {
            response.data
                .pipe(fs.createWriteStream(image_path))
                .on('finish', () => resolve())
                .on('error', e => reject(e));
        }),
    );

// Initialize the invite cache
const invites = {};
bot.on('ready', function() {
        console.log("bot is now online");
    })
    // A pretty useful method to create a delay without blocking the whole script.
const wait = require('util').promisify(setTimeout);
bot.on('ready', () => {
    bot.user.setStatus('available')
    bot.user.setActivity('!help', { type: 'LISTENING' });
});
bot.on("message", async message => {
    //if (message.webhookID) {message.delete({ timeout: 3000 })};
    
    if (message.content.toLowerCase().indexOf("!help") == 0) {
        message.channel.send("<@" + message.author + "> \n```\ncommands:\n!dl 177013 (to download)\n!listdl (for print list downloaded)\n!help (for print this help)\n```")
        } else if (message.content.toLowerCase().indexOf("!listdl") == 0) {
        	message.channel.send("<@" + message.author + "> \n||https://nhentai.0xd.workers.dev/||")
        } else if (message.content.toLowerCase().indexOf("!dl") == 0) {
            var str = message.content.toLowerCase()
            str = str.replace("!dl", '').trim();
            (async function() {
                var dir = "Chapter"
                    //var arr
               	var nh = `https://nhentai.net/g/${str}`;
                var title = "_"
                var chap = ""
                    await axios.get(nh)
                        .then(async res => {
                            const data = res.data
                            var arr = getArrNhentai(data)
                            var name = getNameNhentai(nh)
                            console.log("Retrieving Gallery information: " + name)
                            console.log("Found the image: " + arr[0].value)
                            dir = './nhentai_' + name;
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir);
                            }
                            const Embed = new Discord.MessageEmbed()
				.setColor('#DD474D')
				.setTitle(`Downloading ${name}`)
				.setURL('')
				.setDescription('Downloading.....')
				.setThumbnail(arr[0].value)
				.setTimestamp()
			    //msg.send(Embed);
			    msg = await message.channel.send("<@" + message.author + "> Retrieving Gallery information", Embed)
                            msg.edit("<@" + message.author + "> Uploading images to the server")
                            for (let i = 0; i < arr.length; i++) {
                                var v = arr[i].value.replace("t.nhentai", "i.nhentai")
                                v = v.replace("t.", ".")
                                await download_nhentai(v, dir + '/' + i + getPage(arr[i].value));
                                if (i % 5 == 0) {
                                    msg.edit("<@" + message.author + "> Uploading images to the server\n" + progressBar(i, arr.length))
                                } else if (i == (arr.length - 1)) {
                                    msg.edit("<@" + message.author + "> Uploading images to the server\n" + progressBar(i, arr.length))
                                }
                            }
                            msg.delete(Embed)
                        })
                msg.edit("<@" + message.author + "> Compressing to ZIP\n" + progressBar(50, 100))
                msg.edit("<@" + message.author + "> Compressing to ZIP\n" + progressBar(100, 100))
                await zipDirectory(dir, dir + ".zip")
                await fs.readFile('credentials.json', (err, content) => {
                    if (err) return console.log('Error loading client secret file:', err);
                    // Authorize a client with credentials, then call the Google Drive API.
                    authorize(JSON.parse(content), function(token) {
                        //console.log("Got Token"); 
                        msg.edit("<@" + message.author + "> Uploading to google drive:" + progressBar(50, 100))
                        msg.edit("<@" + message.author + "> Uploading to google drive:" + progressBar(100, 100))
                        uploadFile(msg, dir.replace("./", "") + ".zip", message.channel.id, "<@" + message.author + ">", token)
                        
                    });
                });
            })();
        } 
})
function getUserFromMention(mention) {
    // The id is the first and only match found by the RegEx.
    const matches = mention.match(/<@!?(\d+)>/gi);
    // If supplied variable was not a mention, matches will be null instead of an array.
    if (!matches) return false;
    // However the first element in the matches array will be the entire mention, not just the ID,
    // so use index 1.
    //const id = matches[1];
    else return matches[1];
}
function getPage(mention) {
    // The id is the first and only match found by the RegEx.
    const matches = mention.match(/.(jpg|png|jpeg|gif)/g);
    return matches[0]
}
function getNameNhentai(link) {
    const matches = link.match(/g\/([0-9])*/gi);
    return matches[0].replace("g/", "")
}
function getArrNhentai(data) {
    var doc = new dom({
        locator: {},
        errorHandler: {
            warning: function(w) {},
            error: function(e) {},
            fatalError: function(e) {
                console.error(e)
            }
        }
    }).parseFromString(data);
    var nodes = xpath.select(`//*[@id="thumbnail-container"]/div[1]/div/a/img/@data-src`, doc)
    return nodes
}
global.progressBar = (value, maxValue) => {
    size = 15
    const percentage = value / maxValue; // Calculate the percentage of the bar
    const progress = Math.round((size * percentage)); // Calculate the number of square caracters to fill the progress side.
    const emptyProgress = size - progress; // Calculate the number of dash caracters to fill the empty progress side.
    //▰
    const progressText = '▰'.repeat(progress); // Repeat is creating a string with progress * caracters in it
    const emptyProgressText = '▱'.repeat(emptyProgress); // Repeat is creating a string with empty progress * caracters in it
    const percentageText = Math.round10(percentage * 100, -1) + '%'; // Displaying the percentage of the bar
    if (percentage == 1) return '```ini\nProgress: [' + progressText + emptyProgressText + '] ' + '100%\n```';
    else return '```ini\nProgress: [' + progressText + emptyProgressText + '] ' + percentageText + '\n```'; // Creating the bar
    //return bar;
};
function zipDirectory(source, out) {
    const archive = archiver('zip', {
        zlib: {
            level: 9
        }
    });
    const stream = fs.createWriteStream(out);
    return new Promise((resolve, reject) => {
        archive
            .directory(source, false)
            .on('error', err => reject(err))
            .pipe(stream);
        stream.on('close', () => resolve());
        archive.finalize();
    });
}
function bytesToSize(bytes) {
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes == 0) return '0 Byte';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};
function directorySize(path, cb, size) {
  if (size === undefined) {
    size = 0;
  }

  fs.stat(path, function(err, stat) {
    if (err) {
      cb(err);
      return;
    }

    size += stat.size;

    if (!stat.isDirectory()) {
      cb(null, size);
      return;
    }

    fs.readdir(path, function(err, paths) {
      if (err) {
        cb(err);
        return;
      }

      async.map(paths.map(function(p) { return path + '/' + p }), directorySize, function(err, sizes) {
        size += sizes.reduce(function(a, b) { return a + b }, 0);
        cb(err, size);
      })
    })
  })
}
function authorize(credentials, callback) {
    const {
        client_secret,
        client_id,
        redirect_uris
    } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}
 function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return callback(err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client).catch(console.error);
    });
  });
}
/**
 * Describe with given media and metaData and upload it using google.drive.create method()
 */
function uploadFile(msg, name, messid, author, auth) {
    const drive = google.drive({
        version: 'v3',
        auth
    });
    var folderId = process.env.FOLDER_ID;
    const fileMetadata = {
        'name': name,
        parents: [folderId]
    };
    const media = {
        mimeType: 'application/zip',
        body: fs.createReadStream('./' + name)
    };
    drive.files.create({
        supportsAllDrives: true,
        resource: fileMetadata,
        media: media,
        fields: 'id'
    }, (err, file) => {
        if (err) {
            // Handle error
            msg.edit("<@" + message.author + "> Error! Please try again")
        } else {
            var fileId = file.data.id;
            console.log(fileId)
            var permissions = [{
                'type': 'anyone',
                'role': 'reader'
            }];
            // Using the NPM module 'async'
            async.eachSeries(permissions, function(permission, permissionCallback) {
                drive.permissions.create({
                    supportsAllDrives: true,
                    resource: permission,
                    fileId: fileId,
                    fields: 'id', 
            	}, function(err, res) {
                    if (err) {
                        // Handle error...
                        msg.edit("<@" + message.author + "> Error! Please try again")
                        permissionCallback(err);
                    } else {
                        //console.log('Permission ID: ', res.id)
                        permissionCallback();
                    }
                });
            }, function(err) {
                if (err) {
                    // Handle error
                    msg.edit("<@" + message.author + "> Error! Please try again")
                } else {
                    rimraf('./' + name.replace(".zip", ''), function() {
                        console.log('done');
                    });
                    fs.unlinkSync('./' + name)
                    const Embed = new Discord.MessageEmbed()
				.setColor('#DD474D')
				.setTitle(`Click here to Download ${name}`)
				.setURL(`https://drive.google.com/file/d/${fileId}/view`)
				.setDescription(`To start download, click the title above.\n\nor you can download on [list file](https://nhentai.0xd.workers.dev/)`)
				//.setThumbnail('https://i.imgur.com/wSTFkRM.png')
				.setTimestamp()
		    //bot.channels.cache.get(messid).send();
                    bot.channels.cache.get(messid).send(author, Embed);
                    msg.delete({
                        timeout: 1
                    });
                }
            });
        }
    });
}
(function() {
    function decimalAdjust(type, value, exp) {
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math[type](value);
        }
        value = +value;
        exp = +exp;
        
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
        // Shift
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    }
    if (!Math.round10) {
        Math.round10 = function(value, exp) {
            return decimalAdjust('round', value, exp);
        };
    }
    if (!Math.floor10) {
        Math.floor10 = function(value, exp) {
            return decimalAdjust('floor', value, exp);
        };
    }
    if (!Math.ceil10) {
        Math.ceil10 = function(value, exp) {
            return decimalAdjust('ceil', value, exp);
        };
    }
})();
bot.login(process.env.BOT_TOKEN);
