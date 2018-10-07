interface IIdentifier {
    resultName: string;
    identifier: string;
}

interface IInternalIdentifer extends IIdentifier {
    index: number;
    leftSideCharacters?: string;
    rightSideCharacters?: string;
    rightSideCharactersIndex?: number;
}

function breakDown(string: string, format: string, identifiers: any): any {
    let internalIdentifiers: IInternalIdentifer[] = [];
    for(const identifier of identifiers) {
        internalIdentifiers.push({
            ...identifier,
            index: format.indexOf(identifier.identifier),
        });
    }
    internalIdentifiers = internalIdentifiers.sort((a, b) => {
        return a.index - b.index;
    }).filter(object => {
        return object.index !== -1;
    }); // remove the indexes that weren't found (not found means index value of -1)

    if(internalIdentifiers.length > 0) {
        internalIdentifiers[0].leftSideCharacters = format.slice(0, internalIdentifiers[0].index);
        for(let i = 0; i < internalIdentifiers.length; i++) { // this will handle all the characters between the internalIdentifiers
            const { identifier, index } = internalIdentifiers[i];

            if(i + 1 !== internalIdentifiers.length) { // this is not the last array item
                const nextIndex = internalIdentifiers[i + 1].index; // we can use i + 1 because it will never return undefined because we skip the last item
                const characters = format.slice(index + identifier.length, nextIndex);
                internalIdentifiers[i].rightSideCharacters = characters;
                internalIdentifiers[i + 1].leftSideCharacters = characters;
            }
        }
        const previousItem = internalIdentifiers[internalIdentifiers.length - 1];
        previousItem.rightSideCharacters = format.slice(previousItem.index + previousItem.identifier.length);
    }

    let finished = false;
    const brokenDown: any = {};
    for(let i = 0; i < internalIdentifiers.length; i++) {
        const item = internalIdentifiers[i];
        const { resultName, leftSideCharacters, rightSideCharacters } = internalIdentifiers[i];
        const previousItem = internalIdentifiers[i - 1];

        const leftSideCharactersIndex = previousItem === undefined ? leftSideCharacters.length : previousItem.rightSideCharactersIndex + previousItem.rightSideCharacters.length;
        let rightSideCharactersIndex = rightSideCharacters === '' ? string.length : string.indexOf(rightSideCharacters, leftSideCharactersIndex);
        if(rightSideCharactersIndex === -1) {
            rightSideCharactersIndex = string.length;
        }
        item.rightSideCharactersIndex = rightSideCharactersIndex;

        if(finished) {
            brokenDown[resultName] = null;
            continue;
        }

        brokenDown[resultName] = string.slice(leftSideCharactersIndex, rightSideCharactersIndex);

        if(rightSideCharactersIndex === string.length) {
            finished = true;
        }
    }

    return brokenDown;
}

export interface IProxy {
    address: string;
    port: number;
    username: string;
    password: string;
}

export function getProxy(proxy: string, format = '#address#:#port#:#username#:#password#'): IProxy {
    return breakDown(proxy, format, [
        {
            resultName: 'address',
            identifier: '#address#',
        },
        {
            resultName: 'port',
            identifier: '#port#',
        },
        {
            resultName: 'username',
            identifier: '#username#',
        },
        {
            resultName: 'password',
            identifier: '#password#',
        },
    ]);
}

export function getProxyString(proxy: IProxy): string {
    return `${proxy.address}:${proxy.port}${proxy.username ? `${proxy.username}:${proxy.password}` : ''}`;
}

export function getProxiesArray(proxies: string[], format = '#address#:#port#:#username#:#password#'): IProxy[] {
    const array: IProxy[] = [];
    for(const proxy of proxies) {
        array.push(getProxy(proxy, format));
    }
    return array;
}
