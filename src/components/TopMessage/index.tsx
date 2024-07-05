import { useTheme } from "styled-components";
import { Container, Title } from "./styles";
import { IconProps } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type IconBoxProps = (props: IconProps) => JSX.Element

type Props = {
    Icon?: IconBoxProps;
    title: string
}

export function TopMessages({ title, Icon }: Props) {

    const { COLORS } = useTheme()
    const insets = useSafeAreaInsets()

    const paddingTop = insets.top + 5;

    return (
        <Container style={{ paddingTop }}>
            {
                Icon &&
                <Icon
                    size={18}
                    color={COLORS.GRAY_100}
                />
            }
            <Title>

            </Title>
        </Container>
    )
}