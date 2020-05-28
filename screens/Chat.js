import React, { useState, useEffect, useRef } from "react";
import MessagesList from "./MessagesList";
import kuzzle from "../services/kuzzle";
import { Container, Toast, Input, Form, Item, Label } from "native-base";

export default function Chat({ currentUsername }) {
  const [newMessage, setNewMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [messagesFetched, setMessagesFetched] = useState(false);

  let myTextInput = React.createRef();

  const formatMessage = (message) => {
    return {
      id: message._id,
      author: message._source.author,
      text: message._source.text,
      date: new Date(message._source._kuzzle_info.createdAt).toLocaleString(),
    };
  };

  const fetchMessages = async () => {
    try {
      const results = await kuzzle.document.search(
        "chat",
        "messages",
        { sort: { "_kuzzle_info.createdAt": { order: "asc" } } },
        { size: 100 }
      );
      const fetchedMessages = results.hits.map((message) =>
        formatMessage(message)
      );
      setMessages(fetchedMessages);
      setMessagesFetched(true);
    } catch (err) {
      console.error(err.message);
    }
  };

  const subscribeToMessages = async () => {
    try {
      const roomId = await kuzzle.realtime.subscribe(
        "chat",
        "messages",
        {},
        async (notification) => {
          if (
            notification.type !== "document" ||
            notification.action !== "create"
          ) {
            return;
          }
          setMessages([...messages, formatMessage(notification.result)]);
        }
      );

      setRoomId(roomId);
    } catch (err) {
      console.error(err.message);
    }
  };

  const sendMessage = async () => {
    try {
      await kuzzle.document.create(
        "chat",
        "messages",

        {
          text: newMessage,
          author: currentUsername,
        }
      );
      setNewMessage(null);
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    if (!messagesFetched) {
      fetchMessages();
    }

    if (messagesFetched && !roomId) {
      subscribeToMessages();
    }
  }, [messagesFetched, roomId]);

  return (
    <Container style={{ flex: 1 }}>
      <Container style={{ flex: 1 }}>
        <MessagesList messages={messages} currentUsername={currentUsername} />
      </Container>
      <Form>
        <Item floatingLabel>
          <Label>Your message</Label>
          <Input
            ref={myTextInput}
            onChangeText={(message) => setNewMessage(message)}
            onSubmitEditing={() => sendMessage()}
            value={newMessage}
          />
        </Item>
      </Form>
    </Container>
  );
}
