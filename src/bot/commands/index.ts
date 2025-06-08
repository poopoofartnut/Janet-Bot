import { warn } from 'console';
import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, Guild, GuildChannel, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, InteractionCollector, ComponentType } from 'discord.js';
import { logCommand, getLogsForGuild } from '../utils/commandLogger';

export function getCommands() {
    return [
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Replies with Pong!')
            .toJSON(),
        new SlashCommandBuilder()
            .setName('warn')
            .setDescription('Warns a user in the server')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to warn')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('The reason for the warning')
                    .setRequired(false))
            .toJSON(),
        new SlashCommandBuilder()
            .setName('jailsetup')
            .setDescription('Creates the Jail role and Prison channels if not present')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .toJSON(),
        new SlashCommandBuilder()
            .setName('jail')
            .setDescription('Jails a user in the server')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to jail')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('The reason for jailing')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
            .toJSON(),
        new SlashCommandBuilder()
            .setName('unjail')
            .setDescription('Removes the Jail role from a user')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to unjail')
                    .setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
            .toJSON(),
        new SlashCommandBuilder()
            .setName('logs')
            .setDescription('View recent server logs')
            .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
            .toJSON(),
        new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Kicks a user from the server')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to kick')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('The reason for kicking')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
            .toJSON(),
        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Bans a user from the server')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to ban')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('The reason for banning')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
            .toJSON(),
        new SlashCommandBuilder()
            .setName('mute')
            .setDescription('Mutes a user in the server')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to mute')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('The reason for muting')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
            .toJSON(),
    ];
}

// Map command names to their handler functions
export const commandHandlers: { [key: string]: (interaction: ChatInputCommandInteraction) => Promise<void> } = {
    ping: async (interaction) => {
        const response = 'Pong!';
        await interaction.reply(response);
        await logCommand({
            guildId: interaction.guildId!,
            userId: interaction.user.id,
            command: 'ping',
            timestamp: new Date(),
            args: {},
            response // Save response
        });
    },
    warn: async (interaction) => {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!user) {
            const response = 'User not found!';
            await interaction.reply({ content: response, flags: MessageFlags.Ephemeral });
            await logCommand({
                guildId: interaction.guildId!,
                userId: interaction.user.id,
                command: 'warn',
                timestamp: new Date(),
                args: { user: null, reason },
                response
            });
            return;
        }

        const author = interaction.user.tag;
        const authorAvatar = interaction.user.displayAvatarURL();
        const botAvatar = interaction.client.user?.displayAvatarURL();
        const response = `User "${user.tag}" has been warned by "${author}" for: "${reason}"`;
        await interaction.reply({ content: response, flags: MessageFlags.Ephemeral });
        await user.send({
            embeds: [
                {
                    color: 15548997,
                    footer: {
                        icon_url: botAvatar,
                        text: "Janet Bot"
                    },
                    author: {
                        name: author,
                        icon_url: authorAvatar
                    },
                    fields: [
                        {
                            name: "Warning",
                            value: `You have been warned by "${author}" for: "${reason}"`
                        }
                    ]
                }
            ]
        });
        await logCommand({
            guildId: interaction.guildId!,
            userId: interaction.user.id,
            command: 'warn',
            timestamp: new Date(),
            args: { user: user.tag, reason },
            response
        });
    },
    jailsetup: async (interaction) => {
        if (!interaction.guild) {
            await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
            return;
        }

        const guild = interaction.guild;

        // Check/create "Jail" role
        let jailRole = guild.roles.cache.find(r => r.name === "Jail");
        if (!jailRole) {
            jailRole = await guild.roles.create({
                name: "Jail",
                color: 0xFF0000, // Red
                reason: "Jail role for punishing users"
            });
        }

        // Check/create "Prison" category
        let prisonCategory = guild.channels.cache.find(
            c => c.type === ChannelType.GuildCategory && c.name === "Prison"
        );
        if (!prisonCategory) {
            prisonCategory = await guild.channels.create({
                name: "Prison",
                type: ChannelType.GuildCategory,
                reason: "Category for jail channels"
            });
        }

        // Check/create "Prison" text channel
        let prisonText = guild.channels.cache.find(
            c => c.type === ChannelType.GuildText && c.name === "prison" && c.parentId === prisonCategory.id
        );
        if (!prisonText) {
            prisonText = await guild.channels.create({
                name: "prison",
                type: ChannelType.GuildText,
                parent: prisonCategory.id,
                reason: "Text channel for jailed users",
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: ['SendMessages'],
                    },
                    {
                        id: jailRole.id,
                        allow: ['ViewChannel', 'SendMessages'],
                    }
                ]
            });
        } else {
            // Update permissions if already exists
            await (prisonText as import('discord.js').TextChannel).permissionOverwrites.set([
                {
                    id: guild.roles.everyone.id,
                    deny: ['SendMessages'],
                },
                {
                    id: jailRole.id,
                    allow: ['ViewChannel', 'SendMessages'],
                }
            ]);
        }

        // Check/create "Prison" voice channel
        let prisonVoice = guild.channels.cache.find(
            c => c.type === ChannelType.GuildVoice && c.name === "Prison" && c.parentId === prisonCategory.id
        );
        if (!prisonVoice) {
            prisonVoice = await guild.channels.create({
                name: "Prison",
                type: ChannelType.GuildVoice,
                parent: prisonCategory.id,
                reason: "Voice channel for jailed users",
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: ['Connect'],
                    },
                    {
                        id: jailRole.id,
                        allow: ['ViewChannel', 'Connect', 'Speak'],
                    }
                ]
            });
        } else {
            // Update permissions if already exists
            await (prisonVoice as import('discord.js').VoiceChannel).permissionOverwrites.set([
                {
                    id: guild.roles.everyone.id,
                    deny: ['Connect'],
                },
                {
                    id: jailRole.id,
                    allow: ['ViewChannel', 'Connect', 'Speak'],
                }
            ]);
        }

        // Restrict "Jail" role in all other channels outside "Prison" category
        guild.channels.cache.forEach(async (channel) => {
            if (channel.parentId !== prisonCategory.id) {
                if (channel.type === ChannelType.GuildText) {
                    await channel.permissionOverwrites.edit(jailRole, {
                        SendMessages: false,
                        ViewChannel: null // Don't hide, just restrict sending
                    });
                }
                if (channel.type === ChannelType.GuildVoice) {
                    await channel.permissionOverwrites.edit(jailRole, {
                        Speak: false,
                        Connect: false,
                        ViewChannel: null
                    });
                }
            }
        });

        await interaction.reply("Jail role and Prison channels are set up!");

        await logCommand({
            guildId: guild.id,
            userId: interaction.user.id,
            command: 'jailsetup',
            timestamp: new Date(),
            args: {},
            response: "Jail role and Prison channels are set up!"
        });
    },
    jail: async (interaction) => {
        if (!interaction.guild) {
            await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
            return;
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!user) {
            const response = 'User not found!';
            await interaction.reply({ content: response, flags: MessageFlags.Ephemeral });
            await logCommand({
                guildId: interaction.guildId!,
                userId: interaction.user.id,
                command: 'jail',
                timestamp: new Date(),
                args: { user: null, reason },
                response
            });
            return;
        }

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            const response = 'Member not found in this server!';
            await interaction.reply({ content: response, flags: MessageFlags.Ephemeral });
            await logCommand({
                guildId: interaction.guildId!,
                userId: interaction.user.id,
                command: 'jail',
                timestamp: new Date(),
                args: { user: user.tag, reason },
                response
            });
            return;
        }

        // Find the Jail role
        let jailRole = interaction.guild.roles.cache.find(r => r.name === "Jail");
        if (!jailRole) {
            const response = 'Jail role not found! Please run /jailsetup first.';
            await interaction.reply({ content: response, flags: MessageFlags.Ephemeral });
            await logCommand({
                guildId: interaction.guildId!,
                userId: interaction.user.id,
                command: 'jail',
                timestamp: new Date(),
                args: { user: user.tag, reason },
                response
            });
            return;
        }

        // Add the Jail role to the user
        await member.roles.add(jailRole, `Jailed by ${interaction.user.tag} for: ${reason}`);

        const author = interaction.user.tag;
        const authorAvatar = interaction.user.displayAvatarURL();
        const botAvatar = interaction.client.user?.displayAvatarURL();
        const response = `User "${user.tag}" has been jailed by "${author}" for: "${reason}"`;
        await interaction.reply({ content: response, flags: MessageFlags.Ephemeral });
        await user.send({
            embeds: [
                {
                    color: 15548997,
                    footer: {
                        icon_url: botAvatar,
                        text: "Janet Bot"
                    },
                    author: {
                        name: author,
                        icon_url: authorAvatar
                    },
                    fields: [
                        {
                            name: "Jailed",
                            value: `You have been jailed by "${author}" for: "${reason}"`
                        }
                    ]
                }
            ]
        }).catch(() => {});

        await logCommand({
            guildId: interaction.guildId!,
            userId: interaction.user.id,
            command: 'jail',
            timestamp: new Date(),
            args: { user: user.tag, reason },
            response
        });
    },
    unjail: async (interaction) => {
        if (!interaction.guild) {
            await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
            return;
        }

        const user = interaction.options.getUser('user');
        if (!user) {
            const response = 'User not found!';
            await interaction.reply({ content: response, flags: MessageFlags.Ephemeral });
            await logCommand({
                guildId: interaction.guildId!,
                userId: interaction.user.id,
                command: 'unjail',
                timestamp: new Date(),
                args: { user: null },
                response
            });
            return;
        }

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            const response = 'Member not found in this server!';
            await interaction.reply({ content: response, flags: MessageFlags.Ephemeral });
            await logCommand({
                guildId: interaction.guildId!,
                userId: interaction.user.id,
                command: 'unjail',
                timestamp: new Date(),
                args: { user: user.tag },
                response
            });
            return;
        }

        // Find the Jail role
        let jailRole = interaction.guild.roles.cache.find(r => r.name === "Jail");
        if (!jailRole) {
            const response = 'Jail role not found!';
            await interaction.reply({ content: response, flags: MessageFlags.Ephemeral });
            await logCommand({
                guildId: interaction.guildId!,
                userId: interaction.user.id,
                command: 'unjail',
                timestamp: new Date(),
                args: { user: user.tag },
                response
            });
            return;
        }

        // Remove the Jail role from the user
        await member.roles.remove(jailRole, `Unjailed by ${interaction.user.tag}`);

        const author = interaction.user.tag;
        const authorAvatar = interaction.user.displayAvatarURL();
        const botAvatar = interaction.client.user?.displayAvatarURL();
        const response = `User "${user.tag}" has been unjailed by "${author}".`;
        await interaction.reply({ content: response, flags: MessageFlags.Ephemeral });
        await user.send({
            embeds: [
                {
                    color: 5763719, // Green
                    footer: {
                        icon_url: botAvatar,
                        text: "Janet Bot"
                    },
                    author: {
                        name: author,
                        icon_url: authorAvatar
                    },
                    fields: [
                        {
                            name: "Unjailed",
                            value: `You have been unjailed by "${author}".`
                        }
                    ]
                }
            ]
        }).catch(() => {});

        await logCommand({
            guildId: interaction.guildId!,
            userId: interaction.user.id,
            command: 'unjail',
            timestamp: new Date(),
            args: { user: user.tag },
            response
        });
    },
    logs: async (interaction) => {
        if (!interaction.guild) {
            await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
            return;
        }

        const logs = await getLogsForGuild(interaction.guildId!);
        if (!logs.length) {
            await interaction.reply({ content: "No logs found for this server.", flags: MessageFlags.Ephemeral });
            return;
        }

        const pageSize = 5;
        let page = 0;
        const totalPages = Math.ceil(logs.length / pageSize);

        function getEmbed(page: number) {
            const start = page * pageSize;
            const end = start + pageSize;
            const pageLogs = logs.slice(start, end);

            return new EmbedBuilder()
                .setTitle(`Server Logs (Page ${page + 1}/${totalPages})`)
                .setColor(0x5865F2)
                .setDescription(
                    pageLogs.map(log =>
                        `**${new Date(log.timestamp).toLocaleString()}**\n` +
                        `Command: \`${log.command}\`\n` +
                        `User: <@${log.userId}>\n` +
                        `Args: \`${JSON.stringify(log.args)}\`\n` +
                        `Response: ${log.response}`
                    ).join('\n\n')
                );
        }

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(totalPages <= 1)
            );

        await interaction.reply({
            embeds: [getEmbed(page)],
            components: [row],
            flags: MessageFlags.Ephemeral
        });

        const message = await interaction.fetchReply();

        const collector = interaction.channel!.createMessageComponentCollector({
            message: message as any,
            componentType: ComponentType.Button,
            time: 60_000
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: "These buttons aren't for you!", flags: MessageFlags.Ephemeral });
                return;
            }
            if (i.customId === 'prev') page--;
            if (i.customId === 'next') page++;
            // Update buttons
            row.components[0].setDisabled(page === 0);
            row.components[1].setDisabled(page === totalPages - 1);
            await i.update({
                embeds: [getEmbed(page)],
                components: [row]
            });
        });

        collector.on('end', async () => {
            row.components.forEach(btn => btn.setDisabled(true));
            await (interaction.editReply({
                components: [row]
            }).catch(() => {}));
        });
    },
    kick: async (interaction) => {
        if (!interaction.guild) {
            await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
            return;
        }
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        if (!user) {
            await interaction.reply({ content: "User not found!", flags: MessageFlags.Ephemeral });
            return;
        }
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            await interaction.reply({ content: "Member not found in this server!", flags: MessageFlags.Ephemeral });
            return;
        }
        await member.kick(reason);
        await interaction.reply({ content: `User "${user.tag}" has been kicked. Reason: ${reason}`, flags: MessageFlags.Ephemeral });
        await logCommand({
            guildId: interaction.guildId!,
            userId: interaction.user.id,
            command: 'kick',
            timestamp: new Date(),
            args: { user: user.tag, reason },
            response: `User "${user.tag}" has been kicked. Reason: ${reason}`
        });
    },
    ban: async (interaction) => {
        if (!interaction.guild) {
            await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
            return;
        }
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        if (!user) {
            await interaction.reply({ content: "User not found!", flags: MessageFlags.Ephemeral });
            return;
        }
        await interaction.guild.members.ban(user.id, { reason });
        await interaction.reply({ content: `User "${user.tag}" has been banned. Reason: ${reason}`, flags: MessageFlags.Ephemeral });
        await logCommand({
            guildId: interaction.guildId!,
            userId: interaction.user.id,
            command: 'ban',
            timestamp: new Date(),
            args: { user: user.tag, reason },
            response: `User "${user.tag}" has been banned. Reason: ${reason}`
        });
    },
    mute: async (interaction) => {
        if (!interaction.guild) {
            await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
            return;
        }
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        if (!user) {
            await interaction.reply({ content: "User not found!", flags: MessageFlags.Ephemeral });
            return;
        }
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            await interaction.reply({ content: "Member not found in this server!", flags: MessageFlags.Ephemeral });
            return;
        }
        await member.timeout(60 * 60 * 1000, reason); // 1 hour mute
        await interaction.reply({ content: `User "${user.tag}" has been muted for 1 hour. Reason: ${reason}`, flags: MessageFlags.Ephemeral });
        await logCommand({
            guildId: interaction.guildId!,
            userId: interaction.user.id,
            command: 'mute',
            timestamp: new Date(),
            args: { user: user.tag, reason },
            response: `User "${user.tag}" has been muted for 1 hour. Reason: ${reason}`
        });
    },
};