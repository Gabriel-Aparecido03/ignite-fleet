import { useEffect, useRef, useState } from 'react';
import { TextInput, ScrollView, Alert } from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { useNavigation } from '@react-navigation/native';
import { useUser } from '@realm/react';

import { useRealm } from '../../libs/realm';
import { Historic } from '../../libs/realm/schemas/Historic';

import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { LicensePlateInput } from '../../components/LicensePlateInput';
import { TextAreaInput } from '../../components/TextAreaInput';

import { Container, Content, Message, MessageContent } from './styles';
import { licensePlateValidate } from '../../utils/licensePlateValidate';
import { LocationAccuracy, LocationObjectCoords, LocationSubscription, requestBackgroundPermissionsAsync, useForegroundPermissions, watchPositionAsync } from 'expo-location';
import { getAddressLocation } from '../../utils/getAddressLocation';
import { Loading } from '../../components/Loading';
import { LocationInfo } from '../../components/LocationInfo';
import { Car } from 'phosphor-react-native';
import { Map } from '../../components/Map';
import { startLocationTask } from '../../tasks/backgroundLocationTask';
import { openSettings } from '../../utils/openSettings';

export function Departure() {

  const [description, setDescription] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [isRegistering, setIsResgistering] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<string | null>(null)
  const [currentCoords, setCurrentCords] = useState<LocationObjectCoords | null>(null)

  const [locationForegorundPermission, requestLocationForegorundPermission] = useForegroundPermissions()

  const realm = useRealm();
  const user = useUser();
  const { goBack } = useNavigation();

  const descriptionRef = useRef<TextInput>(null);
  const licensePlateRef = useRef<TextInput>(null);

  async function handleDepartureRegister() {
    setIsResgistering(true);
    try {
      if (!licensePlateValidate(licensePlate)) {
        licensePlateRef.current?.focus();
        return Alert.alert('Placa inválida', 'A placa é inválida. Por favor, informa a placa correta.')
      }

      if (description.trim().length === 0) {
        descriptionRef.current?.focus();
        return Alert.alert('Finalidade', 'Por favor, informe a finalidade da utilização do veículo')
      }

      if (!currentCoords?.latitude && !currentCoords?.longitude) {
        return Alert.alert('Localização', 'Localização inválida')
      }

      const backgroundPermission = await requestBackgroundPermissionsAsync()

      if (!backgroundPermission.granted) {
        setIsResgistering(false)
        return Alert.alert(
          'Localização',
          'É necessário permitir que o App tenha acesso localização em segundo plano. Acesse as configurações do dispositivo e habilite "Permitir o tempo todo."',
          [{ text: 'Abrir configurações', onPress: openSettings }]
        )
      }

      await startLocationTask()

      realm.write(() => {
        realm.create('Historic', Historic.generate({
          user_id: user!.id,
          license_plate: licensePlate,
          description,
          coords: [{
            latitude: currentCoords.latitude,
            longitude: currentCoords.longitude,
            timestamp: new Date().getTime()
          }]
        }))
      });

      Alert.alert('Saída', 'Saída do veículo registrada com sucesso.');

      goBack();

    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não possível registrar a saída do veículo.');
      setIsResgistering(false)
    }
  }

  useEffect(() => {
    requestLocationForegorundPermission()
  }, [])

  useEffect(() => {
    setIsLoadingLocation(true)
    if (!locationForegorundPermission?.granted) return

    let subscription: LocationSubscription
    watchPositionAsync({ accuracy: LocationAccuracy.High, timeInterval: 1000 }, (location) => {
      setCurrentCords(location.coords)
      getAddressLocation(location.coords).then((address) => {
        if (address) setCurrentAddress(address)
      }).finally(() => setIsLoadingLocation(false))
    })
      .then(response => subscription = response)

    return () => {
      if (subscription) subscription.remove()
    }
  }, [!locationForegorundPermission?.granted])

  if (!locationForegorundPermission?.granted) {
    return (
      <Container>
        <MessageContent>
          <Message>
            Você precisa permitir que o aplicativo tenha acesso a
            localização para acessar essa funcionalidade. Por favor, acesse as
            configurações do seu dispositivo para conceder a permissão ao aplicativo.
          </Message>

          <Button title='Abrir configurações' onPress={openSettings} />
        </MessageContent>
      </Container>
    )
  }

  if (isLoadingLocation) return <Loading />

  return (
    <Container>
      <Header title='Saída' />

      <KeyboardAwareScrollView extraHeight={100}>

        <ScrollView>
          {currentCoords && <Map coordinates={[currentCoords]} />}
          <Content>
            {
              currentAddress && <LocationInfo icon={Car} label='Localização Atual' description={currentAddress} />
            }
            <LicensePlateInput
              ref={licensePlateRef}
              label='Placa do veículo'
              placeholder="BRA1234"
              onSubmitEditing={() => {
                descriptionRef.current?.focus()
              }}
              returnKeyType='next'
              onChangeText={setLicensePlate}
            />

            <TextAreaInput
              ref={descriptionRef}
              label='Finalizade'
              placeholder='Vou utilizar o veículo para...'
              onSubmitEditing={handleDepartureRegister}
              returnKeyType='send'
              blurOnSubmit
              onChangeText={setDescription}
            />

            <Button
              title='Registar Saída'
              onPress={handleDepartureRegister}
              isLoading={isRegistering}
            />
          </Content>
        </ScrollView>
      </KeyboardAwareScrollView>
    </Container>
  );
}