const devops20210625 = require('@alicloud/devops20210625');
const OpenApi = require('@alicloud/openapi-client');
const Util = require('@alicloud/tea-util');
const Tea = require('@alicloud/tea-typescript');
const core = require('@actions/core');
const github = require('@actions/github');

const accessKeyId = core.getInput("accessKeyId");
const accessKeySecret = core.getInput("accessKeySecret");
const accessToken = core.getInput("accessToken");
const organizationId = core.getInput("organizationId");
const repositoryName = core.getInput("repositoryName");

class Client {

    /**
     * 使用AK&SK初始化账号Client
     * @return Client
     * @throws Exception
     */
    static createClient() {
        // 工程代码泄露可能会导致 AccessKey 泄露，并威胁账号下所有资源的安全性。以下代码示例仅供参考。
        // 建议使用更安全的 STS 方式，更多鉴权访问方式请参见：https://help.aliyun.com/document_detail/378664.html。
        let config = new OpenApi.Config({
            // 必填，请确保代码运行环境设置了环境变量 ALIBABA_CLOUD_ACCESS_KEY_ID。
            accessKeyId: accessKeyId,
            // 必填，请确保代码运行环境设置了环境变量 ALIBABA_CLOUD_ACCESS_KEY_SECRET。
            accessKeySecret: accessKeySecret,
        });
        // Endpoint 请参考 https://api.aliyun.com/product/devops
        config.endpoint = `devops.cn-hangzhou.aliyuncs.com`;
        return new devops20210625.default(config);
    }

    static async getRepositoryId(client, repositoryName) {
        let request = new devops20210625.GetRepositoryRequest({
            accessToken: accessToken,
            organizationId: organizationId,
            identity: repositoryName
        });
        let runtime = new Util.RuntimeOptions({});
        let headers = {};
        let response = await client.getRepository(request, headers, runtime);
        if (response.body.success != true) {
            core.error(`can't find repositoryId of ${repositoryName}`)
        }
        return response.body.repository.id;
    }

    static async triggerSync(client, repositoryId) {
        let request = new devops20210625.TriggerRepositoryMirrorSyncRequest({
            accessToken: accessToken,
            organizationId: organizationId
        })
        let runtime = new Util.RuntimeOptions({});
        let headers = {};
        let res = await client.triggerRepositoryMirrorSync(repositoryId, request, headers, runtime);
        return res;
    }

    static async main() {
        let client = Client.createClient();
        let repositoryId = await Client.getRepositoryId(client, `${organizationId}/${repositoryName}`);
        let res = await Client.triggerSync(client, repositoryId);
        core.info(res);
    }
}

exports.Client = Client;
Client.main();
