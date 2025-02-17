import { clearUser } from "../../features/user/UserSlice";
import { useAppDispatch } from "../../store/hooks";
import "../../styles/Logout.css";

export const Logout = () => {
    const dispatch = useAppDispatch();
    const logout = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}:${process.env.PORT}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                localStorage.removeItem('user');
                console.log("logged out");
                dispatch(clearUser());
                window.location.reload();
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    return <button className="logout-button" onClick={logout}>Logout</button>;
}