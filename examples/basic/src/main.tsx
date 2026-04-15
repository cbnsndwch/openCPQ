import { Root, t, rootPath, Problems } from '@cbnsndwch/opencpq';
import { createRoot } from 'react-dom/client';
import '@cbnsndwch/opencpq/styles.css';

// A small laptop configurator to exercise the library.
const LaptopType = t.panel(
    { header: 'Laptop configuration' },
    t.group([
        t.member(
            'name',
            'Config name',
            t.string({ defaultValue: 'My laptop' })
        ),
        t.member(
            'cpu',
            'CPU',
            t.select([
                t.defaultOption(t.option('i5', 'Intel Core i5')),
                t.option('i7', 'Intel Core i7'),
                t.option('i9', 'Intel Core i9')
            ])
        ),
        t.member(
            'ram',
            'RAM',
            t.select([
                t.option('8', '8 GB'),
                t.defaultOption(t.option('16', '16 GB')),
                t.option('32', '32 GB'),
                t.option('64', '64 GB')
            ])
        ),
        t.member('touchscreen', 'Touchscreen', t.boolean())
    ])
);

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(
        <Root
            type={LaptopType}
            initialCtxProvider={() => ({
                path: rootPath,
                problems: new Problems()
            })}
        />
    );
}
