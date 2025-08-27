'use client';

import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import PlansManagement from './PlansManagement';
import CouponsTab from '../CouponsTab';

export default function PlansTab() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold">Gerenciamento de Planos</h2>
                <p className="text-gray-400">Crie, edite e gerencie os planos de assinatura e cupons de desconto.</p>
            </div>

            <Tabs defaultValue="plans" className="space-y-6">
                <TabsList className="bg-transparent border-b border-gray-800 w-full justify-start h-auto p-0 space-x-4">
                    <TabsTrigger value="plans" className="bg-transparent px-0 pb-3 ml-2 rounded-none">Planos</TabsTrigger>
                    <TabsTrigger value="coupons" className="bg-transparent px-0 pb-3 ml-2 rounded-none">Cupons</TabsTrigger>
                </TabsList>

                <TabsContent value="plans" className="space-y-6">
                    <PlansManagement />
                </TabsContent>

                <TabsContent value="coupons" className="space-y-6">
                    <CouponsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}