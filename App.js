import React, { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import * as Font from "expo-font";
import { AppLoading } from "expo";
import {
  Root,
  Header,
  Body,
  Title,
  Container,
  Content,
  Toast,
  Text,
} from "native-base";
import LoginForm from "./screens/LoginForm";
import Chat from "./screens/Chat";
import kuzzle from "./services/kuzzle";

export default function App() {
  const [connected, setConnected] = useState(false);
  const [isRessourcesLoaded, setIsRessourcesLoaded] = useState(false);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [jwt, setJwt] = useState(null);
  const [verifiedToken, setVerifiedToken] = useState(null);

  const connectToKuzzle = async () => {
    try {
      await kuzzle.connect();
    } catch (err) {
      console.log(err);
      setConnected(false);
      showToast(
        "danger",
        "It looks like you're not connected to Kuzzle Mobile. Trying to reconnect..."
      );
    }
  };

  const handleKuzzleEvents = () => {
    kuzzle.on("connected", () => {
      setConnected(true);
    });

    kuzzle.on("reconnected", () => {
      setConnected(true);
    });

    kuzzle.on("disconnected", () => {
      setConnected(false);

      showToast(
        "danger",
        "It looks like you're not connected to Kuzzle Mobile. Trying to reconnect..."
      );
    });

    kuzzle.on("tokenExpired", () => {
      setIsLoggedIn(false);

      showToast(
        "warning",
        "Your sessions is expired, you need to re-authenticate."
      );
    });
  };

  const fetchCurrentUsername = async () => {
    try {
      const credentials = await kuzzle.auth.getMyCredentials("local");
      setCurrentUsername(credentials.username);
    } catch (err) {
      showToast(
        "danger",
        "Sorry an error occured during managing user informations."
      );
    }
  };

  const showToast = (type, message) => {
    return Toast.show({
      text: message,
      duration: 8000,
      type: type,
    });
  };

  const loadRessources = async () => {
    await Promise.all([
      Font.loadAsync({
        Roboto: require("native-base/Fonts/Roboto.ttf"),
        Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
      }),
    ]);
  };

  const onLoadingError = (err) => {
    console.log(err);
    showToast(
      "danger",
      "Sorry an error occured during while the application is loading"
    );
  };

  const persistJwt = async (jwt) => {
    try {
      await SecureStore.setItemAsync("jwt", jwt);
    } catch (err) {
      console.log(err);
      showToast(
        "danger",
        "Sorry an error occured during managing user informations."
      );
    }
  };

  const fetchJwt = async () => {
    try {
      const jwt = await SecureStore.getItemAsync("jwt");
      if (jwt) {
        setJwt(jwt);
      } else {
        setVerifiedToken({ valid: false });
      }
    } catch (err) {
      console.log(err);
      showToast(
        "danger",
        "Sorry an error occured during managing user informations."
      );
    }
  };

  const checkTokenValidity = async () => {
    const verifiedToken = await kuzzle.auth.checkToken();
    setVerifiedToken(verifiedToken);
  };

  const refreshUserToken = async () => {
    try {
      const refreshedToken = await kuzzle.auth.refreshToken({
        expiresIn: "2d",
      });

      persistJwt(refreshedToken.jwt);
    } catch (err) {
      console.log(err);
      showToast(
        "danger",
        "Sorry an error occured during managing user informations."
      );
    }
  };

  const onLoginSuccess = (jwt) => {
    setJwt(jwt);
  };

  useEffect(() => {
    if (isRessourcesLoaded) {
      handleKuzzleEvents();
      connectToKuzzle();
    }
  }, [isRessourcesLoaded]);

  useEffect(() => {
    if (connected) {
      fetchJwt();
    }
  }, [connected]);

  useEffect(() => {
    if (jwt) {
      kuzzle.jwt = jwt;
      checkTokenValidity();
    }
  }, [jwt]);

  useEffect(() => {
    if (verifiedToken && verifiedToken.valid) {
      refreshUserToken();
      fetchCurrentUsername();
      setIsLoggedIn(true);
      setIsLoadingComplete(true);
    } else if (verifiedToken && !verifiedToken.valid) {
      setIsLoggedIn(false);
      setIsLoadingComplete(true);
    }
  }, [verifiedToken]);

  const renderApp = () => {
    if (!isRessourcesLoaded || !isLoadingComplete) {
      return (
        <AppLoading
          startAsync={loadRessources}
          onError={onLoadingError}
          onFinish={() => setIsRessourcesLoaded(true)}
        />
      );
    }

    const pageContent = isLoggedIn ? (
      <Chat currentUsername={currentUsername} />
    ) : (
      <LoginForm onLoginSuccess={onLoginSuccess} />
    );

    return (
      <Root>
        <Container>
          <Header>
            <Body>
              <Title>Kuzzle Chat</Title>
            </Body>
          </Header>
          <Container padder>{pageContent}</Container>
        </Container>
      </Root>
    );
  };

  return renderApp();
}
