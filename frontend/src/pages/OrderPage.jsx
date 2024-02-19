import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Form, Button, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { 
    useGetOrderDetailsQuery,
    usePayOrderMutation,
    useGetPayPalClientIdQuery,
} from '../slices/ordersApiSlice';

const OrderPage = () => {
    const { id: orderId } = useParams();

    const { data: order, refetch, isLoading, error } = useGetOrderDetailsQuery(orderId);

    // pay order function
    const [payOrder, { isLoading: loadingPay }] = usePayOrderMutation();

    const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();

    const { data: paypal, isLoading: loadingPayPal, error: errorPayPal } = useGetPayPalClientIdQuery();

    // user data from state
    const { userInfo } = useSelector((state) => state.auth);

    useEffect(() => {
        // if PayPal has correctly returned client ID
        if (!errorPayPal && !loadingPayPal && paypal.clientId) {
            const loadPayPalScript = async () => {
                // dispatch payment following PayPal API docs
                paypalDispatch({
                    type: 'resetOptions',
                    value: {
                        'client-id': paypal.clientId,
                        currency: 'USD',
                    }
                });
                paypalDispatch({ type: 'setLoadingStatus', value: 'pending' });
            }
            // if order hasn't been paid
            if (order && !order.isPaid) {
                // and paypal window hasn't loaded
                if (!window.paypal) {
                    // make payment
                    loadPayPalScript();
                }
            }
        }
    }, [order, paypal, paypalDispatch, loadingPayPal, errorPayPal]);

    // captures the funds from the transaction and shows a message
    function onApprove(data, actions) {
        return actions.order.capture().then(async function (details) {
            try {
                await payOrder({orderId, details});
                refetch();
                toast.success('Payment successful');
            } catch (error) {
                toast.error(error?.data?.message || error.message)
            }
        });
    };

    // tester function that simulates payment without triggering PayPal API
    async function onApproveTest() {
        await payOrder({orderId, details: {payer: {} }});
        refetch();
        toast.success('Payment successful');
    };

    function onError() {};

    function createOrder() {};

    return isLoading ? (
            <Loader />
            ) : error ? <Message variant='danger' /> : (
            <>
                <h1>Order</h1>
                <Row>
                    <Col md={8}>
                        <ListGroup varian='flush'>
                            <ListGroup.Item>
                                <h2>Shipping</h2>
                                <p>
                                    <strong>Name: </strong>
                                    {order.user.name}
                                </p>
                                <p>
                                    <strong>Email: </strong>
                                    {order.user.email}
                                </p>
                                <p>
                                    <strong>Address: </strong>
                                    {order.shippingAddress.address}, {' '}
                                    {order.shippingAddress.city} {order.shippingAddress.postalCode}, {' '}
                                    {order.shippingAddress.country}
                                </p>
                                { order.isDelivered ? (
                                    <Message variant='success'>
                                        Delivered on {order.deliveredAt}
                                    </Message>
                                ) : (
                                    <Message variant='danger'>
                                        Not Delivered
                                    </Message>
                                )}
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <h2>Payment Method</h2>
                                <p>
                                    <strong>Method: </strong>
                                    {order.paymentMethod}
                                </p>
                                { order.isPaid ? (
                                    <Message variant='success'>
                                        Paid on {order.paidAt}
                                    </Message>
                                ) : (
                                    <Message variant='danger'>
                                        Not Paid
                                    </Message>
                                )}
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <h2>Order Items</h2>
                                {order.orderItems.map((item, index) => (
                                    <ListGroup.Item key={index}>
                                        <Row>
                                            <Col xs={2} md={2}>
                                                <Image 
                                                    src={item.image} 
                                                    alt={item.name} 
                                                    fluid 
                                                    rounded 
                                                />
                                            </Col>
                                            <Col>
                                                <Link to={`/product/${item.product}`}>
                                                    {item.name}
                                                </Link>
                                            </Col>
                                            <Col md={4}>
                                                {item.qty} x ${item.price} = ${item.qty * item.price}
                                            </Col>
                                        </Row>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup.Item>
                        </ListGroup>
                    </Col>
                    <Col md={4}>
                        <Card>
                            <ListGroup variant='flush'>
                                <ListGroup.Item>
                                    <h2>Order Summary</h2>
                                </ListGroup.Item>

                                <ListGroup.Item>
                                    <Row>
                                        <Col>Items</Col>
                                        <Col>${order.itemsPrice}</Col>
                                    </Row>

                                    <Row>
                                        <Col>Shipping</Col>
                                        <Col>${order.shippingPrice ? order.shippingPrice : '0'}</Col>
                                    </Row>

                                    <Row>
                                        <Col>Tax</Col>
                                        <Col>${order.taxPrice}</Col>
                                    </Row>

                                    <Row>
                                        <Col>Total</Col>
                                        <Col>${order.totalPrice}</Col>
                                    </Row>
                                </ListGroup.Item>
                                
                                {!order.isPaid && (
                                    <ListGroup.Item>
                                        {loadingPay && <Loader />}
                                        {isPending ? <Loader /> : (
                                            <div>
                                                <Button 
                                                    onClick={onApproveTest}
                                                    style={{marginBottom: '10px'}}
                                                >Test Pay Order</Button>
                                                <div>
                                                    <PayPalButtons
                                                        createOrder={createOrder}
                                                        onApprove={onApprove}
                                                        onError={onError}
                                                    ></PayPalButtons>
                                                </div>
                                            </div>
                                        )}
                                    </ListGroup.Item>
                                )}

                                {/* MARK AS DELIVERED PLACEHOLDER */}
                            </ListGroup>
                        </Card>
                    </Col>
                </Row>
            </>
        )
};

export default OrderPage;