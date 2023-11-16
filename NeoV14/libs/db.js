const {Sequelize, DataTypes} = require('sequelize');
const sequelize = new Sequelize({ username: DataTypes.STRING, database: DataTypes.STRING, 
							dialect: "sqlite", dialectModule: require("sqlite3"), 
							storage: `${__dirname}/DATA.db`, define: {freezeTableName: true, charset: "utf-8"}, logging: false
						});

const verified = sequelize.define("verified", {
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

const unverified = sequelize.define("unverified", {
	id: {
		primaryKey: true,
		type: DataTypes.STRING,
		allowNull: false
	},
	mc: {
		type: DataTypes.JSON,
		allowNull: false
	},
	wl_msg: {
		type: DataTypes.STRING,
		allowNull: false
	}
});


const blacklist = sequelize.define("blacklist", {
	id: {
		primaryKey: true,
		type: DataTypes.STRING,
		allowNull: false
	}
});

const rr = sequelize.define("rr", {
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


(async () => {
	await sequelize.sync();
})()


module.exports = {
	verified,
	unverified,
	blacklist,
	rr
}

//sequelize = new _sequelize.Sequelize({ username: config.db_user, database: config.db_name, password: config.db_password, dialect: "sqlite", dialectModule: require("sqlite3"), storage: config.db_file, define: {freezeTableName: true, charset: "utf-8"}, logging: log })