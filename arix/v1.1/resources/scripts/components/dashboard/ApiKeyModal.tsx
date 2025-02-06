import React, { useContext } from 'react';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import asModal from '@/hoc/asModal';
import ModalContext from '@/context/ModalContext';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { useTranslation } from 'react-i18next';

interface Props {
    apiKey: string;
}

const ApiKeyModal = ({ apiKey }: Props) => {
    const { t } = useTranslation('arix/account');
    const { dismiss } = useContext(ModalContext);

    return (
        <>
            <h3 css={tw`mb-6 text-2xl`}>{t('apiKey.your-keys')}</h3>
            <p css={tw`text-sm mb-6`}>
                {t('apiKey.store-save')}
            </p>
            <pre css={tw`text-sm bg-neutral-900 rounded py-2 px-4 font-mono`}>
                <CopyOnClick text={apiKey}>
                    <code css={tw`font-mono`}>{apiKey}</code>
                </CopyOnClick>
            </pre>
            <div css={tw`flex justify-end mt-6`}>
                <Button onClick={() => dismiss()}>
                    {t('apiKey.close')}
                </Button>
            </div>
        </>
    );
};

ApiKeyModal.displayName = 'ApiKeyModal';

export default asModal<Props>({
    closeOnEscape: false,
    closeOnBackground: false,
})(ApiKeyModal);
