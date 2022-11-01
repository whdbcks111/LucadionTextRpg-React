
import DateFormat from '../modules/DateFormat.mjs';

function MessageArea({ chat }) {
    return (
        <div className='message-area'>
            <img className='profile-box' src={ chat.profilePic } alt='' />
            <div className='non-profile-box'>
                <div className='above_message'>
                    <span className='sender-name'>{ chat.senderName }</span>
                    <span className='send-date'>{ new DateFormat(new Date(chat.date)).format('ma h:mm') }</span>
                </div>
                <div className='message'>
                    { chat.message }
                </div>
            </div>
        </div>
    );
}
export default MessageArea;