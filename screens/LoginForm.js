import React, { useState, useEffect } from "react";
import {
  Form,
  Item,
  Input,
  Label,
  Button,
  Text,
  Toast,
  Content,
} from "native-base";
import AsyncStorage from "@react-native-community/async-storage";
import kuzzle from "../services/kuzzle";

export default function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState(null);
  const [isUsernameEmpty, setIsUsernameEmpty] = useState(false);
  const [password, setPassword] = useState(null);
  const [isPasswordEmpty, setIsPasswordEmpty] = useState(false);

  const handleLogin = async () => {
    let canPerformLogin = true;
    setIsUsernameEmpty(false);
    setIsPasswordEmpty(false);

    if (!username) {
      canPerformLogin = false;
      setIsUsernameEmpty(true);
    }

    if (!password) {
      canPerformLogin = false;
      setIsPasswordEmpty(true);
    }

    if (canPerformLogin) {
      let jwt = null;

      try {
        jwt = await kuzzle.auth.login("local", {
          username,
          password,
        });

        onLoginSuccess(jwt);
      } catch (err) {
        console.log(err);
        showToast("danger", err.message);
        return;
      }
    }
  };

  const showToast = (type, message) => {
    return Toast.show({
      text: message,
      duration: 5000,
      type: type,
    });
  };

  return (
    <Content>
      <Form>
        <Item floatingLabel error={isUsernameEmpty}>
          <Label>Username</Label>
          <Input onChangeText={(username) => setUsername(username)} />
        </Item>
        <Item floatingLabel error={isPasswordEmpty}>
          <Label>Password</Label>
          <Input
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
          />
        </Item>
        <Button
          block
          onPress={handleLogin}
          style={{
            marginTop: 32,
          }}
        >
          <Text>Login</Text>
        </Button>
      </Form>
    </Content>
  );
}
