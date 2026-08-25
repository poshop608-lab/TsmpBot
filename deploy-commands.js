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
    .setName('post-resource-access')
    .setDescription('Post a Get Access embed for a resource in a channel (staff only)')
    .addStringOption(opt =>
      opt.setName('resource')
        .setDescription('Which resource')
        .setRequired(true)
        .addChoices(
          { name: 'Asia Mech Model', value: 'asia-mech' },
          { name: 'London Mech Model', value: 'london-mech' },
          { name: 'Trinity Framework', value: 'trinity' },
          { name: 'Goldbach Time & PO3 Ranges', value: 'gbt' },
          { name: 'News Protocols', value: 'news-protocols' },
          { name: '22 Model Refined', value: 'model22' },
          { name: 'Quarterly Theory Model', value: 'qtmodel' },
          { name: 'Notes Archive', value: 'notes' },
        ))
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to post in (defaults to this channel)')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('test-welcome')
    .setDescription('Test the welcome card in the welcome channel'),

  new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Manually post a welcome card for a user (staff only)')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('The member to welcome')
        .setRequired(true)
    ),

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
    .setName('create-invite')
    .setDescription('Generate a permanent server invite link via the bot (staff only)'),

  new SlashCommandBuilder()
    .setName('purge-channel')
    .setDescription('Delete every message in this channel, or a named channel (staff only)')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to purge (defaults to the channel you run this in)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('vol1-override')
    .setDescription('Grant a member (or everyone) extra streams this week on top of their volume tier base (staff only)')
    .addIntegerOption(opt =>
      opt.setName('extra_sessions')
        .setDescription('How many extra streams to add on top of their tier base (Vol I: 2, Vol II: 3, Vol III/IV: 5)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(3)
    )
    .addUserOption(opt =>
      opt.setName('member')
        .setDescription('The member to grant extra streams to — omit to grant everyone with a Volume role')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('reset-stream-quota')
    .setDescription('Reset weekly stream quota — for one member or everyone (staff only)')
    .addUserOption(opt =>
      opt.setName('member')
        .setDescription('Member to reset (omit to reset everyone)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('stream-history')
    .setDescription('Show past /host-stream sessions with attendance + VC minutes per person (staff only)')
    .addStringOption(opt =>
      opt.setName('date')
        .setDescription('Pick a date that had a stream — leave blank for the 10 most recent')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName('stream-leaderboard')
    .setDescription('Rank Volume members by stream attendance, and flag who has never attended (staff only)'),

  new SlashCommandBuilder()
    .setName('host-stream')
    .setDescription('Announce a live stream and post the Join VC gate (staff only)')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('The voice channel the stream will be in')
        .addChannelTypes(2) // GuildVoice
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('cancel-stream')
    .setDescription('Cancel the currently active stream gate (staff only)'),

  new SlashCommandBuilder()
    .setName('setup-modlog')
    .setDescription('Create Admin category + mod-log channel and start logging all server events (staff only)'),

  new SlashCommandBuilder()
    .setName('setup-signals')
    .setDescription('Create the hidden Signals category + channel, gated to Premium Signal role (staff only)'),

  new SlashCommandBuilder()
    .setName('setup-sweep-alerts')
    .setDescription('Create Sweep Alerts role, channels, and self-assign button (staff only)'),

  new SlashCommandBuilder()
    .setName('test-sweep')
    .setDescription('Fire test sweep alert embeds to the sweep channel (staff only)'),

  new SlashCommandBuilder()
    .setName('setup-vc-alerts')
    .setDescription('Create VC Alerts role, vc-schedule channel, and self-assign button (staff only)'),

  new SlashCommandBuilder()
    .setName('vc-schedule')
    .setDescription('Schedule a VC session with a live countdown (staff only)')
    .addStringOption(opt =>
      opt.setName('channel')
        .setDescription('Which VC channel')
        .setRequired(true)
        .addChoices(
          { name: '🔊 Live Trading',   value: 'Live Trading'   },
          { name: '🔊 Market Review',  value: 'Market Review'  },
          { name: '🔊 Study Session',  value: 'Study Session'  },
          { name: '🔊 Beginner Only',  value: 'Beginner Only'  },
          { name: '🔊 1-on-1',         value: '1-on-1'         },
        )
    )
    .addStringOption(opt =>
      opt.setName('host')
        .setDescription('Who is hosting this session')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('note')
        .setDescription('Session topic or note (e.g. "NQ trade review")')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('time')
        .setDescription('Preset start time (ET)')
        .setRequired(true)
        .addChoices(
          { name: '8:40 AM ET',          value: '08:40' },
          { name: '9:00 AM ET',          value: '09:00' },
          { name: '9:30 AM ET',          value: '09:30' },
          { name: '10:00 AM ET',         value: '10:00' },
          { name: '11:00 AM ET',         value: '11:00' },
          { name: '2:00 PM ET',          value: '14:00' },
          { name: '3:00 PM ET',          value: '15:00' },
          { name: '3:30 AM ET (London)', value: '03:30' },
        )
    )
    .addStringOption(opt =>
      opt.setName('custom_time')
        .setDescription('Override with custom HH:MM 24h ET (e.g. 13:45) — overrides preset time')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('vc-cancel')
    .setDescription('Cancel the active VC countdown (staff only)'),

  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Create a giveaway with a live enter button and spin-the-wheel reveal (staff only)'),

  new SlashCommandBuilder()
    .setName('dropsignal')
    .setDescription('Drop a live signal — posts in general and shows on the website (Volume/staff/Assistant Coach)'),

  new SlashCommandBuilder()
    .setName('setup-freechat')
    .setDescription('Post the user guide embed in free chat channel (staff only)'),

  new SlashCommandBuilder()
    .setName('test-freechat')
    .setDescription('Preview the free chat guide embed (staff only, ephemeral)'),

  new SlashCommandBuilder()
    .setName('test-joincard')
    .setDescription('Preview the join welcome card using your own profile (staff only, ephemeral)'),

  new SlashCommandBuilder()
    .setName('record')
    .setDescription('Start recording a voice channel\'s screen-share + audio')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Voice channel to join and record')
        .addChannelTypes(2) // GuildVoice
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the current recording and upload it'),

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
