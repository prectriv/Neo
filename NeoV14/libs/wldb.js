const { Sequelize, DataTypes } = require('sequelize');
const db = new Sequelize({
	username: DataTypes.STRING, database: DataTypes.STRING,
	dialect: "sqlite", dialectModule: require("sqlite3"),
	storage: `${__dirname}/DATA/WL_DATA.db`, define: { freezeTableName: true, charset: "utf-8" }, logging: false
});

const verified = db.define("verified", {
	id: {
		primaryKey: true,
		type: DataTypes.STRING,
		allowNull: false
	},
	uuid: {
		type: DataTypes.STRING,
		allowNull: false
	}
});

const unverified = db.define("unverified", {
	id: {
		primaryKey: true,
		type: DataTypes.STRING,
		allowNull: false
	},
	mc: {
		type: DataTypes.JSON,
		allowNull: false
	},
	wlMsg: {
		type: DataTypes.STRING,
		allowNull: false
	}
});


const blacklist = db.define("blacklist", {
	id: {
		primaryKey: true,
		type: DataTypes.STRING,
		allowNull: false
	}
});

(async () => {
	await db.sync();
})()


module.exports = {
	verified,
	unverified,
	blacklist
}

//sequelize = new _sequelize.Sequelize({ username: config.db_user, database: config.db_name, password: config.db_password, dialect: "sqlite", dialectModule: require("sqlite3"), storage: config.db_file, define: {freezeTableName: true, charset: "utf-8"}, logging: log })