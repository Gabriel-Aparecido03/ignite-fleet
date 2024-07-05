import { reverseGeocodeAsync } from "expo-location";

type Props = {
  latitude : number
  longitude : number
}

export async function getAddressLocation({ latitude, longitude }: Props) {
  try {
    const adressResponse = await reverseGeocodeAsync({ latitude, longitude })
    return adressResponse[0].street;
  } catch (error) {

  }
}