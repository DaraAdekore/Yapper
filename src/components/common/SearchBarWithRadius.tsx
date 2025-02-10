import React, { useState, useEffect } from "react";
import { Form, FormControl, InputGroup, Button } from "react-bootstrap";

import { useAppSelector } from "../../store/hooks";

interface SearchBarWithRadiusProps {
    searchQuery: string;
    setQuery: (e: string) => void;
    radius: number;
    setRadius: (e: number) => void;
}

const SearchBarWithRadius: React.FC<SearchBarWithRadiusProps> = ({
    searchQuery,
    setQuery,
    radius,
    setRadius,
}) => {
    
    const user = useAppSelector((state) => state.user);

    const handleSearch = async () => {
        console.log(`Search Query: ${searchQuery}, Radius: ${radius}km`);
        const searchT = searchQuery.split(",");
        try {
            const response = await fetch("http://localhost:3312/rooms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    radius: radius >= 1 ? radius : 1000,
                    searchT,
                }),
            });

            if (!response.ok) {
                console.log(response);
            } else {
                const data = await response.json();
                console.log("Filtered rooms:", data);
            }
        } catch (error) {
            console.error(`Error getting filtered rooms: ${error}`);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "10px",
                marginLeft: "auto",
            }}
        >
            <Form
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                    padding: "5px 10px",
                    width: "100%",
                    position: "relative", // Ensure the parent is positioned relatively
                }}
            >
                {/* Search Input */}
                <InputGroup className="me-2" style={{ flex: "2" }}>
                    <FormControl
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            border: "none",
                            borderRadius: "5px",
                            boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.1)",
                            marginLeft: "10px",
                            marginRight: "10px",
                        }}
                    />
                </InputGroup>

                {/* Radius Input */}
                <InputGroup className="me-2" style={{ flex: "1" }}>
                    <FormControl
                        type="number"
                        placeholder="Radius (km)"
                        value={radius}
                        onChange={(e) => {
                            const value = Math.max(0, Math.min(6800, parseInt(e.target.value)));
                            setRadius(value);
                        }}
                        style={{
                            border: "none",
                            borderRadius: "5px",
                            boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.1)",
                            marginLeft: "10px",
                            marginRight: "10px",
                        }}
                    />
                </InputGroup>

                {/* Search Button */}
                <Button
                    variant="primary"
                    onClick={handleSearch}
                    style={{
                        backgroundColor: "#0078ff",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "10px",
                        fontSize: "16px",
                        fontWeight: "bold",
                    }}
                >
                    Search
                </Button>
            </Form>
        </div>
    );
};

export default SearchBarWithRadius;