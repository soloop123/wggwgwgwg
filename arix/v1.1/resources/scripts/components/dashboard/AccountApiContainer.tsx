import React, { useEffect, useState } from 'react';
import ContentBox from '@/components/elements/ContentBox';
import CreateApiKeyForm from '@/components/dashboard/forms/CreateApiKeyForm';
import getApiKeys, { ApiKey } from '@/api/account/getApiKeys';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import deleteApiKey from '@/api/account/deleteApiKey';
import FlashMessageRender from '@/components/FlashMessageRender';
import { format } from 'date-fns';
import tw from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import { Dialog } from '@/components/elements/dialog';
import { useFlashKey } from '@/plugins/useFlash';
import Code from '@/components/elements/Code';
import { useTranslation } from 'react-i18next';

export default () => {
    const { t } = useTranslation('arix/account');
    const [deleteIdentifier, setDeleteIdentifier] = useState('');
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const { clearAndAddHttpError } = useFlashKey('account');

    useEffect(() => {
        getApiKeys()
            .then((keys) => setKeys(keys))
            .then(() => setLoading(false))
            .catch((error) => clearAndAddHttpError(error));
    }, []);

    const doDeletion = (identifier: string) => {
        setLoading(true);

        clearAndAddHttpError();
        deleteApiKey(identifier)
            .then(() => setKeys((s) => [...(s || []).filter((key) => key.identifier !== identifier)]))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => {
                setLoading(false);
                setDeleteIdentifier('');
            });
    };

    return (
        <div className={'grid lg:grid-cols-2 gap-4'}>
            <div>
                <FlashMessageRender byKey={'account'} />
                <CreateApiKeyForm onKeyCreated={(key) => setKeys((s) => [...s!, key])} />
            </div>
            <div>
                <SpinnerOverlay visible={loading} />
                <Dialog.Confirm
                    title={t('apiKey.delete-api-key')}
                    confirm={t('apiKey.delete-key')}
                    open={!!deleteIdentifier}
                    onClose={() => setDeleteIdentifier('')}
                    onConfirmed={() => doDeletion(deleteIdentifier)}
                >
                    {t('apiKey.all-requests-invalidated-1')}&nbsp;
                    <Code>{deleteIdentifier}</Code>&nbsp; 
                    {t('apiKey.all-requests-invalidated-2')}
                </Dialog.Confirm>
                {keys.length === 0 ? (
                    <p css={tw`text-center text-sm`}>
                        {loading ? t('apiKey.loading') : t('apiKey.no-key-found')}
                    </p>
                ) : (
                    keys.map((key, index) => (
                        <GreyRowBox
                            key={key.identifier}
                            css={[tw`bg-neutral-600 flex items-center`, index > 0 && tw`mt-2`]}
                        >
                            <FontAwesomeIcon icon={faKey} css={tw`text-neutral-300`} />
                            <div css={tw`ml-4 flex-1 overflow-hidden`}>
                                <p css={tw`text-sm break-words`}>{key.description}</p>
                                <p css={tw`text-2xs text-neutral-300 uppercase`}>
                                    {t('apiKey.last-used')}:&nbsp;
                                    {key.lastUsedAt ? format(key.lastUsedAt, 'MMM do, yyyy HH:mm') : 'Never'}
                                </p>
                            </div>
                            <p css={tw`text-sm ml-4 hidden md:block`}>
                                <code css={tw`font-mono py-1 px-2 bg-neutral-900 rounded`}>{key.identifier}</code>
                            </p>
                            <button css={tw`ml-4 p-2 text-sm`} onClick={() => setDeleteIdentifier(key.identifier)}>
                                <FontAwesomeIcon
                                    icon={faTrashAlt}
                                    css={tw`text-neutral-400 hover:text-red-400 transition-colors duration-150`}
                                />
                            </button>
                        </GreyRowBox>
                    ))
                )}
            </div>
        </div>
    );
};
