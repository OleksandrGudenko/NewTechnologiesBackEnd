const users = [];

const addUser = ({id, displayName}) => {
	displayName = displayName.trim().toLowerCase();
	
	const liveUser = users.find((user) => user.displayName === displayName);
	
	if(liveUser) {
		return { error: 'Please retry later.' }
	}
	
	const user = {id, displayName};
	
	users.push(user);
	
	return { user }
}

const removeUser = (id) => {
	const  index = users.findIndex((user) => user.id === id)
	
	if(index !== -1) {
		return users.splice(index, 1)[0];
	}
}

const getUser = (id) => users.findIndex((user) => user.id === id);

const getUsersInRoom = (chat) => user.filter((user) => users.chatName === chatName);

module.exports = { addUser, removeUser, getUser, getUsersInRoom };
