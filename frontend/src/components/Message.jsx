import { Alert } from 'react-bootstrap';

const Message = ({ variant, children }) => {
  return (
    <Alert variant={variant}>
        {children}
    </Alert>
  )
};

// default color = light-blue
Message.defaultProps = {
    variant: 'info',
};

export default Message;