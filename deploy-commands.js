require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if bot is online'),

  new SlashCommandBuilder()
    .setName('nq')
    .setDescription('Show current NQ futures price and key levels (~10 min delay)'),

  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Post the access request button in the roles channel'),

  new SlashCommandBuilder()
    .setName('journal')
    .setDescription('Post the journal app embed in journal-app channel'),

  new SlashCommandBuilder()
    .setName('roadmap')
    .setDescription('Post the curriculum roadmap in roadmap channel'),

  new SlashCommandBuilder()
    .setName('roadmap-edit')
    .setDescription('Edit a volume of the roadmap via popup')
    .addStringOption(opt =>
      opt.setName('volume')
        .setDescription('Which volume to update')
        .setRequired(true)
        .addChoices(
          { name: 'Beginner', value: 'vol1' },
          { name: 'Intermediate', value: 'vol2' },
          { name: 'Advanced', value: 'vol3' },
        )
    ),

  new SlashCommandBuilder()
    .setName('news-protocols')
    .setDescription('Post all 10 news protocol images in the news-protocols channel'),

  new SlashCommandBuilder()
    .setName('test-welcome')
    .setDescription('Test the welcome card in the welcome channel'),

  new SlashCommandBuilder()
    .setName('setup-economic-calendar')
    .setDescription('Create the economic-calendar channel and start the weekly scheduler'),

  new SlashCommandBuilder()
    .setName('economic-calendar')
    .setDescription('Post the USD economic calendar to the channel')
    .addStringOption(opt =>
      opt.setName('week')
        .setDescription('Which week to post')
        .setRequired(false)
        .addChoices(
          { name: 'This Week', value: 'thisweek' },
          { name: 'Next Week', value: 'nextweek' },
        )
    ),

  new SlashCommandBuilder()
    .setName('test-economic-calendar')
    .setDescription('Preview the economic calendar card for this or next week')
    .addStringOption(opt =>
      opt.setName('week')
        .setDescription('Which week to preview')
        .setRequired(false)
        .addChoices(
          { name: 'This Week', value: 'thisweek' },
          { name: 'Next Week', value: 'nextweek' },
        )
    ),

  new SlashCommandBuilder()
    .setName('clear-welcome')
    .setDescription('Delete all bot messages in the welcome channel'),

  new SlashCommandBuilder()
    .setName('welcome-all')
    .setDescription('Post a welcome card for every member in the welcome channel'),

  new SlashCommandBuilder()
    .setName('setup-env-engine')
    .setDescription('Create the environment-selection channel for the Environment Engine'),

  new SlashCommandBuilder()
    .setName('env-edit-day')
    .setDescription('Override warning, exec notes, kill zones for a day')
    .addStringOption(opt =>
      opt.setName('day').setDescription('Day to edit').setRequired(true)
        .addChoices(
          { name: 'Monday', value: 'Monday' },
          { name: 'Tuesday', value: 'Tuesday' },
          { name: 'Wednesday', value: 'Wednesday' },
          { name: 'Thursday', value: 'Thursday' },
          { name: 'Friday', value: 'Friday' },
        )
    ),

  new SlashCommandBuilder()
    .setName('env-edit-session')
    .setDescription('Override rating, reason, notes for a specific session')
    .addStringOption(opt =>
      opt.setName('day').setDescription('Day').setRequired(true)
        .addChoices(
          { name: 'Monday', value: 'Monday' },
          { name: 'Tuesday', value: 'Tuesday' },
          { name: 'Wednesday', value: 'Wednesday' },
          { name: 'Thursday', value: 'Thursday' },
          { name: 'Friday', value: 'Friday' },
        )
    )
    .addStringOption(opt =>
      opt.setName('session').setDescription('Session').setRequired(true)
        .addChoices(
          { name: 'London Open', value: 'London' },
          { name: 'Pre-Market', value: 'PreMarket' },
          { name: 'NY Morning', value: 'NYAM' },
          { name: 'Lunch / Dead Zone', value: 'Lunch' },
          { name: 'NY Afternoon', value: 'NYPM' },
        )
    ),

  new SlashCommandBuilder()
    .setName('env-overrides-clear')
    .setDescription('Clear manual overrides for a day or all days')
    .addStringOption(opt =>
      opt.setName('day').setDescription('Day to clear, or ALL').setRequired(true)
        .addChoices(
          { name: 'Monday', value: 'Monday' },
          { name: 'Tuesday', value: 'Tuesday' },
          { name: 'Wednesday', value: 'Wednesday' },
          { name: 'Thursday', value: 'Thursday' },
          { name: 'Friday', value: 'Friday' },
          { name: 'ALL', value: 'ALL' },
        )
    ),

  new SlashCommandBuilder()
    .setName('env-engine')
    .setDescription('Post the Environment Engine session protocol card to the channel')
    .addStringOption(opt =>
      opt.setName('week')
        .setDescription('Which week to post')
        .setRequired(false)
        .addChoices(
          { name: 'This Week', value: 'thisweek' },
          { name: 'Next Week', value: 'nextweek' },
        )
    ),

  new SlashCommandBuilder()
    .setName('test-env-engine')
    .setDescription('Preview the Environment Engine card')
    .addStringOption(opt =>
      opt.setName('week')
        .setDescription('Which week to preview')
        .setRequired(false)
        .addChoices(
          { name: 'This Week', value: 'thisweek' },
          { name: 'Next Week', value: 'nextweek' },
        )
    ),

  new SlashCommandBuilder()
    .setName('setup-sweep-alerts')
    .setDescription('Create Sweep Alerts role, channels, and self-assign button (staff only)'),

  new SlashCommandBuilder()
    .setName('test-sweep')
    .setDescription('Fire test sweep alert embeds to the sweep channel (staff only)'),

].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  console.log('Deploying slash commands...');
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log('Done.');
})();
