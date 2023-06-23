// made with ❤️ by lucas@cfxhosting.fr

const { Client, MessageEmbed, Intents } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  partials: ['MESSAGE', 'CHANNEL']
});

const token = ''; // Le token de votre bot 
const guildId = ''; // ID du serveur 
const channelId = ''; // ID du salon ou l'embed est envoyé
const onlineEmoji = '🟢'; // Emoji quand services ON 
const offlineEmoji = '🔴'; // Emoji quand services OFF
const urls = [
  { name: '**Site Vitrine**', url: 'https://cfxhosting.fr' },
  { name: '**Panel de jeu**', url: 'https://panel.cfxhosting.fr' },
  { name: '**Base de donnée**', url: 'https://panel.cfxhosting.fr/cfxhosting.php' },
  { name: '**Espace client**', url: 'https://my.cfxhosting.fr' },
  // Ajoutez ici les URL supplémentaires à vérifier
];
const buttonUrl = 'https://status.cfxhosting.fr'; // Lien souhaité pour le bouton

let statusEmbed = null;
let channel = null;

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    console.error(`Impossible de trouver la guilde avec l'ID ${guildId}`);
    return;
  }
  channel = guild.channels.cache.get(channelId);
  if (!channel) {
    console.error(`Impossible de trouver le salon avec l'ID ${channelId}`);
    return;
  }
  createEmbed();
  checkStatus();
  setInterval(checkStatus, 60000); // Vérifie l'état toutes les 60 secondes

  // Définir le statut "WATCHING"
  client.user.setActivity('status.cfxhosting.fr', { type: 'WATCHING' });
});

function createEmbed() {
  const embed = new MessageEmbed()
    .setColor('#00FF00') // Modification : Couleur verte pour les services opérationnels
    .setTitle('Problème détecté sur nos services')
    .setTimestamp();

  let fieldsString = '';

  urls.forEach((urlInfo, index) => {
    const fieldString = `${urlInfo.name}: En cours de vérification...\n\n`;
    fieldsString += fieldString;
  });

  embed.setDescription(fieldsString);
  embed.setFooter('CfxHosting Status');
  embed.setAuthor(client.user.username, client.user.displayAvatarURL()); // Ajout du nom du bot et de son avatar dans le footer
  embed.setURL(buttonUrl);
  embed.setTimestamp();
    
  // Ajout des boutons
  embed.addField('\u200B', '\u200B'); // Ajout d'une ligne vide pour l'espace
  embed.addField('Liens', `[Site Vitrine](${urls[0].url}) • [Panel de jeu](${urls[1].url}) • [Base de donnée](${urls[2].url}) • [Espace client](${urls[3].url})`);

  // Mettre à jour le nom du salon avec le statut actuel
  updateChannelName();

  channel.send({ embeds: [embed] })
    .then((message) => {
      statusEmbed = message;
    })
    .catch(console.error);
}

async function checkStatus() {
  const embed = new MessageEmbed()
    .setTitle('Services CfxHosting opérationnels.')
    .setTimestamp();

  let fieldsString = '';

  const statusPromises = urls.map(async (urlInfo, index) => {
    try {
      const response = await axios.get(urlInfo.url);
      const status = response.status === 200 ? `${onlineEmoji} Service __opérationnel.__` : `${offlineEmoji} : Problème __détecté.__`;
      const fieldString = `${urlInfo.name}: ${status}\n\n`;
      fieldsString += fieldString;
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'URL ${urlInfo.name}`, error);
      const fieldString = `${urlInfo.name}: Erreur de vérification\n\n`;
      fieldsString += fieldString;

      // Modification : Mettre à jour la couleur de l'embed en rouge en cas d'erreur
      embed.setColor('#FF0000');
    }
  });

  await Promise.all(statusPromises);

  // Modification : Mettre à jour la couleur de l'embed en vert si tous les services sont opérationnels
  if (fieldsString.includes('Problème __détecté.__')) {
    embed.setColor('#FF0000');
  } else {
    embed.setColor('#00FF00');
  }

  embed.setDescription(fieldsString);
  embed.setFooter('CfxHosting Status');
  embed.setAuthor(client.user.username, client.user.displayAvatarURL()); // Ajout du nom du bot et de son avatar dans le footer
  embed.setURL(buttonUrl);
  embed.setTimestamp();
    
     // Ajout des boutons
  embed.addField('\u200B', '\u200B'); // Ajout d'une ligne vide pour l'espace
  embed.addField('Liens', `[Site Vitrine](${urls[0].url}) • [Panel de jeu](${urls[1].url}) • [Base de donnée](${urls[2].url}) • [Espace client](${urls[3].url})`);

  // Mettre à jour le nom du salon avec le statut actuel
  updateChannelName();

  if (statusEmbed) {
    statusEmbed.edit({ embeds: [embed] })
      .catch(console.error);
  } else {
    console.error("L'embed d'état n'a pas été trouvé.");
    channel.send({ embeds: [embed] })
      .then((message) => {
        statusEmbed = message;
      })
      .catch(console.error);
  }
}

async function updateChannelName() {
  const onlineCount = await urls.reduce(async (countPromise, url) => {
    try {
      const response = await axios.get(url.url);
      const count = await countPromise;
      return response.status === 200 ? count + 1 : count;
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'URL ${url.name}`, error);
      return await countPromise;
    }
  }, Promise.resolve(0));

  const channelName = onlineCount === urls.length ? `${onlineEmoji}・Status` : `${offlineEmoji}・Status`;

  channel.setName(channelName)
    .catch(console.error);
}

client.login(token);