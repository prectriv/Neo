const { Sequelize, DataTypes } = require('sequelize');
const db = new Sequelize({
	username: DataTypes.STRING, database: DataTypes.STRING,
	dialect: "sqlite", dialectModule: require("sqlite3"),
	storage: `${__dirname}/DATA/GUILD_DATA.db`, define: { freezeTableName: true, charset: "utf-8" }, logging: false
});

const rr = db.define("rr", {
	guild: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true
	},
	message: {
		type: DataTypes.STRING,
		allowNull: false
	},
	roles: {
		type: DataTypes.JSON,
		/*
		type: DataTypes.TEXT,
		get() {
			return JSON.parse(this.getDataValue('roles'));
		},
		set(val) {
			this.setDataValue('roles', JSON.stringify(val));
		}
		*/
	}
});

const vcCreator = db.define("vcCreator", {
	guild: {
		type: DataTypes.STRING,
		primaryKey: true
	},
	category: {
		type: DataTypes.STRING
	},
	channel: {
		type: DataTypes.STRING
	},
	spawnedVCs: {
		type: DataTypes.JSON,
		allowNull: false,
		defaultValue: []
	}
});

const guildPref = db.define("pref", {
	guild: {
		type: DataTypes.STRING,
		primaryKey: true
	},
	vccLimit: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 10,
		validate: { //FIXME: Determine if this is working/needed. Also determine a better ammount in the future.
			min: 10, // default limit
			max: 25 // hardcoded limit to prevent overloading a server/the bot
		}
	}
});


(async () => {
	await db.sync();
})()


module.exports = {
	rr,
	vcCreator,
	guildPref
}

//sequelize = new _sequelize.Sequelize({ username: config.db_user, database: config.db_name, password: config.db_password, dialect: "sqlite", dialectModule: require("sqlite3"), storage: config.db_file, define: {freezeTableName: true, charset: "utf-8"}, logging: log })