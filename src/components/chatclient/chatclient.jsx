import React, {Component} from 'react';
import firebase from 'firebase';
import firebasecreds from './firebase.creds';
import './chatclient.css';

class ChatClient extends Component{
	constructor(props){
		super(props);
		//generic key for our firebase subobject 
		this.baseRef =  'chatData';
		this.state = {
			db: null, //the firebase database
			roomOccupants: null, //an object, with keys of IDs with objects of every person in the room with name, when they joined
			//-Lelvzsp9qeKd_YIcIv3: {joined: "5/13/2019, 9:04:14 AM", name: "Dan"}
			messages: null, //an object, with keys of message ids, with objects of every message in this room, with message, sender id, and send time
			//-LelzqdkReqhS2NaVmoz: {message: "test message", name: "haha", senderID: "-LelzqdkReqhS2NaVmoz" }
			name: '', //the name of the active user on this app
			state: 'loading', //which screen to show
			id: null, // the id of the current user
			currentMessage: '' // the message that the user is currently typing/sending
		};
		this.useName = this.useName.bind(this);
		this.handleUpdate = this.handleUpdate.bind(this);
		this.sendMessage = this.sendMessage.bind(this);
		this.updateMessages = this.updateMessages.bind(this);
		this.updateOccupants = this.updateOccupants.bind(this);
	}
	//do this once the lifecycle method fires: the component was mounted
	componentDidMount(){
		this.initializeDB();
	}



	/* database interaction functions */
	initializeDB(){
		const fb = firebase.initializeApp( firebasecreds );
		this.registerDBListeners(fb.database());
		this.setState({
			db: fb.database(),
			state: 'getName'
		});

	}
	// tell database which pieces of data to monitor changes, 
	// and which functions locally to call when they do get changed
	registerDBListeners(db){
		db
			.ref( this.baseRef + '/roomOccupants')
			.on('value', this.updateOccupants );
		db
			.ref( this.baseRef + '/messages')
			.on('value', this.updateMessages );
	}
	//handle a change to the user list
	updateOccupants( data ){
		console.log(data.val());
		this.setState({
			roomOccupants: data.val()
		})
	}
	//handle a change to the messages list
	updateMessages( data ){
		console.log("message list: ",data.val());
		this.setState({
			messages: data.val()
		})
	}
	/* end database interaction functions */

	/* dom event handlers */
	//handle the update of any input
	//takes in a callback to call when the enter key is pressed.
	handleUpdate(event){
		const inputName = event.target.getAttribute('name'); //get the name attribute of the input that was changed
		const allowedInputs = ['name', 'currentMessage']; //a list of inputs we will allow to be changed, to prevent manipulation of state properties that aren't allowed
		if(allowedInputs.indexOf(inputName)!==-1){ //check if it is an allowed name
			console.log("which: ", event);
			if(event.which===13){ //see if the pressed key is the enter key
				console.log('enter pressed');
				callback(); //call the provided callback if it is
			}
			const inputValue = event.target.value; //get the value of the input
			this.setState({
				[inputName]: inputValue //save the input value to the state in a property with the same name as the input
			});
		}
	}
	/* local event handlers / database write functions */
	useName(){
		//push a new object into the firebase DB, then save 
		const postsRef = this.state.db
			.ref( this.baseRef + '/roomOccupants')
			.push({
				name: this.state.name,
				joined: (new Date().toLocaleString())
			});
		//save the key of the user, since that is our key
		this.setState({
			state: 'chat',
			id: postsRef.key
		});
	}
	sendMessage(){
		const postsRef = this.state.db
			.ref( this.baseRef + '/messages')
			.push({
				name: this.state.name,
				senderID: this.state.id,
				sent: (new Date().toLocaleString()),
				message: this.state.currentMessage
			});
	}
	/* end local event handlers / database write functions */
	/* end dom event handlers */


	/* helper render functions : these functions provide content for the main render functions below */

	displayRoomOccupants(){
		if(this.state.roomOccupants===null){
			return <div>No one here.  Which should be impossible, since you are here</div>
		}
		const roomOccupantDomElements = [];
		for( var key in this.state.roomOccupants){
			let occupantClass = 'occupant';
			if(key === this.state.id){
				occupantClass += ' userIsYou';
			}
			let roomOccupantElement = <div key={key} className={occupantClass}>{this.state.roomOccupants[key].name}</div>
			roomOccupantDomElements.push(roomOccupantElement);
		}
		return roomOccupantDomElements;
	}
	displayMessages(){
		console.log('messages: ', this.state.messages);
		if(this.state.messages===null){
			return <div>no messages</div>;
		}
		var allKeys = Object.keys(this.state.messages);
		const messageDomElements = [];
		for( var i = allKeys.length-1; i >= 0; i--){
			let messageClass = 'message';
			let key = allKeys[i];
			if(key === this.state.id){
				messageClass += ' yourMessage';
			}
			let messageElement = <div key={key} className={messageClass}>
									<div className="messageName">{this.state.messages[key].name}</div>
									<div className="messageTime">({this.state.messages[key].sent})</div>
									<div className="messageText">{this.state.messages[key].message}</div>
								</div>
			messageDomElements.push(messageElement);			
		}
		return messageDomElements;
	}
	/* end helper render functions */ 
	/* display state functions, used to show different interfaces depending on what we are doing*/
	state_loading(){
		return (<div>Loading database connection...</div>)
	}
	state_getName(){
		return (<div>
			<input placeholder="enter your name" type="text" onKeyPress={(e)=>e.which===13 ? this.useName() : null} onChange={this.handleUpdate} name="name"/>
			<button onClick={this.useName}>submit</button>
		</div>);
	}
	state_join(){
		//haven't used this yet
		return(
			<div>Joining server...</div>
		);
	}
	state_chat(){
		return(
		<div className="chatContainer">
			<div className="messages">
				<div className="messageList">
					{this.displayMessages()}
				</div>
				<div className="messageInput">
					<input name="currentMessage" type="text" placeholder="enter your message here" onKeyPress={(e)=>e.which===13 ? this.sendMessage() : null} onChange={this.handleUpdate} /><button onClick={this.sendMessage}>send</button>
				</div>
			</div>
			<div className="roomOccupants">{this.displayRoomOccupants()}</div>
		</div>
		);
	}
	/* end display state functions*/
	render(){
		return (<div className="chatApp">
			<h1 class="title">Chat client</h1>
			{ this['state_'+ this.state.state ]()}
		</div>);
	}
}

export default ChatClient;

