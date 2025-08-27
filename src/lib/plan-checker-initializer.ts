// Plan expiration checker removed - functionality moved to UserPlanController

// Inicializar o checker com intervalo de 1 segundo
const initializePlanChecker = () => {
  // O checker foi desativado para ser substituído por uma função agendada no Supabase.
  // const checker = PlanExpirationChecker;
  // checker.startChecking(300); // 5 minutos
  // console.log('[PlanChecker] Verificador de planos iniciado.');
};

export default initializePlanChecker; 