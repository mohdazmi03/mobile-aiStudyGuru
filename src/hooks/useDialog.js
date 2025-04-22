import { useState } from 'react';

export const useDialog = () => {
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});
    const [showPrompt, setShowPrompt] = useState(false);
    const [promptConfig, setPromptConfig] = useState({});

    const alert = (config) => {
        setAlertConfig(config);
        setShowAlert(true);
    };

    const prompt = (config) => {
        setPromptConfig(config);
        setShowPrompt(true);
    };

    const closeAlert = () => setShowAlert(false);
    const closePrompt = () => setShowPrompt(false);

    return {
        showAlert,
        alertConfig,
        showPrompt,
        promptConfig,
        alert,
        prompt,
        closeAlert,
        closePrompt
    };
};