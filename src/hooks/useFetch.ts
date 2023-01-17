import { useEffect, useState } from "react";
import { ExtraObject } from "../types";


export default function useFetch(url: string, extras: RequestInit = {}) {
    const [data, setData] = useState<ExtraObject | null>(null);
    extras.credentials = 'include';
    extras.headers = {
        'Content-Type': 'application/json'
    };

    useEffect(() => {
        console.log('fetch')
        fetch(url, extras).then(res => res.json()).then(data => setData(data));
    }, [url]);

    return data;
}