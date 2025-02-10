import { APIProvider } from "@vis.gl/react-google-maps";
import MapWithCustomStyle from "./Map";

const ApiProvider = () => {
    // Ensure this is properly structured in a parent component
    return (
        <APIProvider apiKey={process.env.REACT_APP_MAPS_API_KEY || ''}>
            <MapWithCustomStyle />
        </APIProvider>
    )
}
export default ApiProvider;